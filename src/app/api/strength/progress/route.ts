import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { strengthExercises, strengthProgressLogs } from "@/lib/schema";

export async function POST(req:Request){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});
  const b=await req.json();
  const exerciseId=String(b.exerciseId||"");
  const logDate=String(b.logDate||new Date().toISOString().slice(0,10));
  const setsCompleted=b.setsCompleted===""||b.setsCompleted==null?null:Number(b.setsCompleted);
  const repsCompleted=b.repsCompleted?String(b.repsCompleted):null;
  const weightKg=b.weightKg===""||b.weightKg==null?null:Number(b.weightKg);
  const rpe=b.rpe===""||b.rpe==null?null:Number(b.rpe);
  const notes=b.notes?String(b.notes).trim():null;

  if(!exerciseId||!/^\d{4}-\d{2}-\d{2}$/.test(logDate))return NextResponse.json({error:"Dados inválidos."},{status:400});
  if(weightKg!=null&&(!Number.isFinite(weightKg)||weightKg<0||weightKg>1000))return NextResponse.json({error:"Carga inválida."},{status:400});
  if(rpe!=null&&(!Number.isFinite(rpe)||rpe<1||rpe>10))return NextResponse.json({error:"RPE deve ficar entre 1 e 10."},{status:400});

  const db=getDb();
  const [exercise]=await db.select({id:strengthExercises.id}).from(strengthExercises)
    .where(and(eq(strengthExercises.id,exerciseId),eq(strengthExercises.userId,userId))).limit(1);
  if(!exercise)return NextResponse.json({error:"Exercício não encontrado."},{status:404});

  const [row]=await db.insert(strengthProgressLogs).values({
    userId,exerciseId,logDate,setsCompleted,repsCompleted,weightKg:weightKg==null?null:String(weightKg),rpe:rpe==null?null:String(rpe),notes
  }).returning();

  return NextResponse.json(row,{status:201});
}
