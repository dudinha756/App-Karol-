import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles, workoutSessions } from "@/lib/schema";
import { estimateExerciseCalories } from "@/lib/energy";
export async function GET(req:Request){const u=await getSessionUserId();if(!u)return NextResponse.json({error:'Não autenticado'},{status:401});const d=new URL(req.url).searchParams.get('date')||new Date().toISOString().slice(0,10);const db=getDb();return NextResponse.json(await db.select().from(workoutSessions).where(and(eq(workoutSessions.userId,u),eq(workoutSessions.logDate,d))).orderBy(desc(workoutSessions.createdAt)))}
export async function POST(req:Request){const u=await getSessionUserId();if(!u)return NextResponse.json({error:'Não autenticado'},{status:401});const b=await req.json();const min=Number(b.durationMinutes);if(!b.type||!min)return NextResponse.json({error:'Informe treino e duração.'},{status:400});const db=getDb();const [p]=await db.select({weightKg:profiles.weightKg}).from(profiles).where(eq(profiles.userId,u)).limit(1);const kcal=estimateExerciseCalories({type:String(b.type),minutes:min,weightKg:Number(p?.weightKg||b.currentWeightKg||60),intensity:String(b.intensity||'moderate')});const [row]=await db.insert(workoutSessions).values({userId:u,logDate:b.logDate||new Date().toISOString().slice(0,10),type:String(b.type),durationMinutes:min,intensity:String(b.intensity||'moderate'),caloriesEstimated:String(kcal)}).returning();return NextResponse.json(row,{status:201})}
