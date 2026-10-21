import { NextResponse } from "next/server";
import { and, eq, lte, gte } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { calendarEvents } from "@/lib/schema";

function dateOnly(value:string){ return new Date(value+"T12:00:00Z"); }
function fmt(d:Date){ return d.toISOString().slice(0,10); }
function addDays(d:Date,n:number){ const x=new Date(d); x.setUTCDate(x.getUTCDate()+n); return x; }
function addMonths(d:Date,n:number){ const x=new Date(d); x.setUTCMonth(x.getUTCMonth()+n); return x; }

function expandEvent(event:any, from:string, to:string){
  const start=dateOnly(event.startDate);
  const rangeStart=dateOnly(from);
  const rangeEnd=dateOnly(to);
  const until=event.recurrenceUntil?dateOnly(event.recurrenceUntil):rangeEnd;
  const stop=until<rangeEnd?until:rangeEnd;
  const out:any[]=[];

  const pushIf=(d:Date)=>{
    if(d>=rangeStart&&d<=rangeEnd&&d<=stop){
      out.push({...event,occurrenceDate:fmt(d),occurrenceId:event.id+"-"+fmt(d)});
    }
  };

  if(event.recurrence==="none"){
    pushIf(start);
    return out;
  }

  let cur=start;
  let guard=0;
  while(cur<=stop&&guard<800){
    pushIf(cur);
    cur=event.recurrence==="daily"?addDays(cur,1):event.recurrence==="weekly"?addDays(cur,7):addMonths(cur,1);
    guard++;
  }
  return out;
}

export async function GET(req:Request){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});

  const url=new URL(req.url);
  const now=new Date();
  const from=url.searchParams.get("from")||new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString().slice(0,10);
  const to=url.searchParams.get("to")||new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,0)).toISOString().slice(0,10);

  const db=getDb();
  const rows=await db.select().from(calendarEvents)
    .where(and(eq(calendarEvents.userId,userId),lte(calendarEvents.startDate,to)));

  const occurrences=rows.flatMap(e=>expandEvent(e,from,to))
    .sort((a,b)=>(a.occurrenceDate+a.startTime).localeCompare(b.occurrenceDate+b.startTime));

  return NextResponse.json({from,to,events:occurrences});
}

export async function POST(req:Request){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});
  const b=await req.json();

  const title=String(b.title||"").trim();
  const eventType=String(b.eventType||"compromisso");
  const startDate=String(b.startDate||"");
  const startTime=String(b.startTime||"");
  const durationMinutes=Number(b.durationMinutes);
  const recurrence=String(b.recurrence||"none");
  const recurrenceUntil=b.recurrenceUntil?String(b.recurrenceUntil):null;
  const notes=b.notes?String(b.notes).trim():null;

  if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)){
    return NextResponse.json({error:"Informe título, data e horário válidos."},{status:400});
  }
  if(!Number.isInteger(durationMinutes)||durationMinutes<5||durationMinutes>1440){
    return NextResponse.json({error:"A duração deve ficar entre 5 minutos e 24 horas."},{status:400});
  }
  if(!["none","daily","weekly","monthly"].includes(recurrence)){
    return NextResponse.json({error:"Recorrência inválida."},{status:400});
  }
  if(recurrence!=="none"&&!recurrenceUntil){
    return NextResponse.json({error:"Informe até quando o evento recorrente deve se repetir."},{status:400});
  }

  const db=getDb();
  const [row]=await db.insert(calendarEvents).values({
    userId,title,eventType,startDate,startTime,durationMinutes,recurrence,recurrenceUntil,notes
  }).returning();

  return NextResponse.json(row,{status:201});
}

export async function DELETE(req:Request){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});
  const id=new URL(req.url).searchParams.get("id")||"";
  if(!id)return NextResponse.json({error:"Evento inválido."},{status:400});

  const db=getDb();
  const [deleted]=await db.delete(calendarEvents)
    .where(and(eq(calendarEvents.id,id),eq(calendarEvents.userId,userId)))
    .returning({id:calendarEvents.id});

  if(!deleted)return NextResponse.json({error:"Evento não encontrado."},{status:404});
  return NextResponse.json({ok:true});
}
