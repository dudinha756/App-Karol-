import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users, profiles, foodEntries, workoutSessions, weightLogs } from "@/lib/schema";
import { calculateBmr, calculateTargets } from "@/lib/energy";
export async function GET(req:Request){
 const u=await getSessionUserId();if(!u)return NextResponse.json({error:'Não autenticado'},{status:401});const date=new URL(req.url).searchParams.get('date')||new Date().toISOString().slice(0,10);const db=getDb();
 const [pRows,foods,workouts,trend]=await Promise.all([
  db.select({name:users.name,age:profiles.age,sex:profiles.sex,heightCm:profiles.heightCm,weightKg:profiles.weightKg,goal:profiles.goal,baselineActivity:profiles.baselineActivity}).from(users).leftJoin(profiles,eq(users.id,profiles.userId)).where(eq(users.id,u)).limit(1),
  db.select().from(foodEntries).where(and(eq(foodEntries.userId,u),eq(foodEntries.logDate,date))).orderBy(asc(foodEntries.createdAt)),
  db.select().from(workoutSessions).where(and(eq(workoutSessions.userId,u),eq(workoutSessions.logDate,date))).orderBy(asc(workoutSessions.createdAt)),
  db.select({logDate:weightLogs.logDate,weightKg:weightLogs.weightKg}).from(weightLogs).where(eq(weightLogs.userId,u)).orderBy(asc(weightLogs.logDate)).limit(14)
 ]);
 const p=pRows[0];if(!p?.age||!p.sex||!p.heightCm||!p.weightKg)return NextResponse.json({error:'Perfil incompleto.'},{status:422});
 const consumed=foods.reduce((a,x)=>a+Number(x.calories),0),protein=foods.reduce((a,x)=>a+Number(x.protein),0),carbs=foods.reduce((a,x)=>a+Number(x.carbs),0),fat=foods.reduce((a,x)=>a+Number(x.fat),0),exercise=workouts.reduce((a,x)=>a+Number(x.caloriesEstimated),0);
 const bmr=calculateBmr({sex:p.sex as 'female'|'male',weightKg:Number(p.weightKg),heightCm:Number(p.heightCm),age:p.age});const t=calculateTargets({bmr,baselineActivity:p.baselineActivity||'light',exerciseCalories:exercise,goal:(p.goal||'muscle_gain') as any,weightKg:Number(p.weightKg)});
 return NextResponse.json({profile:{name:p.name,weightKg:Number(p.weightKg)},summary:{consumed,exercise,maintenance:t.maintenance,target:t.calories,balance:consumed-t.maintenance,protein,carbs,fat,proteinTarget:t.protein,carbsTarget:t.carbs,fatTarget:t.fat},foods,workouts,weightTrend:trend});
}
