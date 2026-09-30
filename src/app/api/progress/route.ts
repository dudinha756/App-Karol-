import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles, weightLogs } from "@/lib/schema";
export async function POST(req:Request){const u=await getSessionUserId();if(!u)return NextResponse.json({error:'Não autenticado'},{status:401});const b=await req.json();const w=Number(b.weightKg);if(!w||w<30||w>300)return NextResponse.json({error:'Peso inválido.'},{status:400});const db=getDb();await db.insert(weightLogs).values({userId:u,logDate:b.logDate||new Date().toISOString().slice(0,10),weightKg:String(w)});await db.update(profiles).set({weightKg:String(w),updatedAt:new Date()}).where(eq(profiles.userId,u));return NextResponse.json({ok:true})}
export async function GET(){const u=await getSessionUserId();if(!u)return NextResponse.json({error:'Não autenticado'},{status:401});const db=getDb();return NextResponse.json(await db.select().from(weightLogs).where(eq(weightLogs.userId,u)).orderBy(desc(weightLogs.logDate)).limit(30))}
