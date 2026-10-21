import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import pdf from "pdf-parse";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { strengthDocuments, strengthRoutines, strengthExercises, strengthProgressLogs } from "@/lib/schema";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function parseWorkoutText(text:string){
  const lines=text.replace(/\r/g,"").split("\n").map(x=>x.replace(/\s+/g," ").trim()).filter(Boolean);
  const exercises:{name:string;sets:number|null;reps:string|null;restSeconds:number|null;notes:string|null}[]=[];

  for(const line of lines.slice(0,120)){
    if(line.length<3||line.length>180)continue;
    if(/^(treino|ficha|aluno|professor|academia|data|observa[cç][aã]o|aquecimento)\b/i.test(line))continue;

    let m=line.match(/^(.+?)\s+(\d{1,2})\s*[xX×]\s*([\d\-–a-zA-Z]+)(?:\s*[-–|]\s*(.*))?$/);
    if(m){
      exercises.push({name:m[1].trim(),sets:Number(m[2]),reps:m[3],restSeconds:null,notes:m[4]?.trim()||null});
      continue;
    }
    m=line.match(/^(\d{1,2})\s*[xX×]\s*([\d\-–a-zA-Z]+)\s+(.+)$/);
    if(m){
      exercises.push({name:m[3].trim(),sets:Number(m[1]),reps:m[2],restSeconds:null,notes:null});
      continue;
    }
    if(/(supino|agachamento|leg press|remada|puxada|rosca|tr[ií]ceps|eleva[cç][aã]o|desenvolvimento|extensora|flexora|stiff|terra|panturrilha|abdut|adut|gl[uú]teo|hip thrust|afundo|passada)/i.test(line)){
      exercises.push({name:line,sets:null,reps:null,restSeconds:null,notes:null});
    }
  }
  return exercises.slice(0,60);
}

export async function GET(){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});
  const db=getDb();

  const routines=await db.select().from(strengthRoutines)
    .where(eq(strengthRoutines.userId,userId))
    .orderBy(desc(strengthRoutines.updatedAt));

  const routineIds=routines.map(r=>r.id);
  if(!routineIds.length)return NextResponse.json({routines:[]});

  const exercises=await db.select().from(strengthExercises)
    .where(and(eq(strengthExercises.userId,userId),inArray(strengthExercises.routineId,routineIds)))
    .orderBy(asc(strengthExercises.sortOrder));

  const exerciseIds=exercises.map(e=>e.id);
  const progress=exerciseIds.length?await db.select().from(strengthProgressLogs)
    .where(and(eq(strengthProgressLogs.userId,userId),inArray(strengthProgressLogs.exerciseId,exerciseIds)))
    .orderBy(desc(strengthProgressLogs.logDate),desc(strengthProgressLogs.createdAt)):[];

  const grouped=routines.map(r=>({
    ...r,
    exercises:exercises.filter(e=>e.routineId===r.id).map(e=>({
      ...e,
      progress:progress.filter(p=>p.exerciseId===e.id).slice(0,8)
    }))
  }));

  return NextResponse.json({routines:grouped});
}

export async function POST(req:Request){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});
  const db=getDb();
  const contentType=req.headers.get("content-type")||"";

  if(contentType.includes("multipart/form-data")){
    const form=await req.formData();
    const file=form.get("file");
    const name=String(form.get("name")||"Treino importado").trim();

    if(!(file instanceof File))return NextResponse.json({error:"Selecione um PDF."},{status:400});
    if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))return NextResponse.json({error:"O arquivo precisa ser PDF."},{status:400});
    if(file.size>10*1024*1024)return NextResponse.json({error:"O PDF deve ter no máximo 10 MB."},{status:400});

    const parsed=await pdf(Buffer.from(await file.arrayBuffer()));
    const text=parsed.text?.trim()||"";
    if(text.length<10)return NextResponse.json({error:"Não consegui ler o texto deste PDF."},{status:422});

    const found=parseWorkoutText(text);
    const [doc]=await db.insert(strengthDocuments).values({userId,fileName:file.name.slice(0,250),rawText:text.slice(0,120000)}).returning();
    const [routine]=await db.insert(strengthRoutines).values({userId,name:name||file.name.replace(/\.pdf$/i,""),sourceDocumentId:doc.id}).returning();

    if(found.length){
      await db.insert(strengthExercises).values(found.map((e,i)=>({
        userId,routineId:routine.id,sortOrder:i,name:e.name,sets:e.sets,reps:e.reps,restSeconds:e.restSeconds,notes:e.notes
      })));
    }

    return NextResponse.json({ok:true,routineId:routine.id,exercisesFound:found.length},{status:201});
  }

  const b=await req.json();
  const name=String(b.name||"").trim();
  const exercises=Array.isArray(b.exercises)?b.exercises:[];

  if(!name)return NextResponse.json({error:"Informe um nome para o treino."},{status:400});
  if(!exercises.length)return NextResponse.json({error:"Adicione pelo menos um exercício."},{status:400});

  const [routine]=await db.insert(strengthRoutines).values({userId,name}).returning();
  await db.insert(strengthExercises).values(exercises.slice(0,80).map((e:any,i:number)=>({
    userId,
    routineId:routine.id,
    sortOrder:i,
    name:String(e.name||"").trim(),
    sets:e.sets?Number(e.sets):null,
    reps:e.reps?String(e.reps):null,
    restSeconds:e.restSeconds?Number(e.restSeconds):null,
    notes:e.notes?String(e.notes).trim():null
  })).filter((e:any)=>e.name));

  return NextResponse.json({ok:true,routineId:routine.id},{status:201});
}

export async function DELETE(req:Request){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});
  const id=new URL(req.url).searchParams.get("id")||"";
  const db=getDb();
  const [row]=await db.delete(strengthRoutines).where(and(eq(strengthRoutines.id,id),eq(strengthRoutines.userId,userId))).returning({id:strengthRoutines.id});
  if(!row)return NextResponse.json({error:"Treino não encontrado."},{status:404});
  return NextResponse.json({ok:true});
}
