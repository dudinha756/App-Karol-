import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { foodEntries } from "@/lib/schema";
export async function GET(req:Request){const u=await getSessionUserId();if(!u)return NextResponse.json({error:'Não autenticado'},{status:401});const d=new URL(req.url).searchParams.get('date')||new Date().toISOString().slice(0,10);const db=getDb();const rows=await db.select().from(foodEntries).where(and(eq(foodEntries.userId,u),eq(foodEntries.logDate,d))).orderBy(desc(foodEntries.createdAt));return NextResponse.json(rows)}
export async function POST(req:Request){const u=await getSessionUserId();if(!u)return NextResponse.json({error:'Não autenticado'},{status:401});const b=await req.json();if(!b.name||!b.calories)return NextResponse.json({error:'Informe alimento e calorias.'},{status:400});const db=getDb();const [row]=await db.insert(foodEntries).values({userId:u,logDate:b.logDate||new Date().toISOString().slice(0,10),mealType:b.mealType||'Refeição',name:String(b.name),quantity:String(b.quantity||1),unit:String(b.unit||'porção'),calories:String(b.calories||0),protein:String(b.protein||0),carbs:String(b.carbs||0),fat:String(b.fat||0)}).returning();return NextResponse.json(row,{status:201})}
