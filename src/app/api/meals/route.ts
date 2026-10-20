import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { foodEntries, foodLibrary } from "@/lib/schema";

export async function GET(req:Request){
  const u=await getSessionUserId();
  if(!u)return NextResponse.json({error:"Não autenticado"},{status:401});
  const d=new URL(req.url).searchParams.get("date")||new Date().toISOString().slice(0,10);
  const db=getDb();
  const rows=await db.select().from(foodEntries)
    .where(and(eq(foodEntries.userId,u),eq(foodEntries.logDate,d)))
    .orderBy(desc(foodEntries.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req:Request){
  const u=await getSessionUserId();
  if(!u)return NextResponse.json({error:"Não autenticado"},{status:401});

  const b=await req.json();
  const db=getDb();

  let name=String(b.name||"").trim();
  let quantity=Number(b.quantity||1);
  let unit=String(b.unit||"porção");
  let calories=Number(b.calories||0);
  let protein=Number(b.protein||0);
  let carbs=Number(b.carbs||0);
  let fat=Number(b.fat||0);

  if(b.foodId){
    const [food]=await db.select().from(foodLibrary)
      .where(and(eq(foodLibrary.id,String(b.foodId)),eq(foodLibrary.userId,u)))
      .limit(1);

    if(!food)return NextResponse.json({error:"Alimento não encontrado."},{status:404});

    const referenceQuantity=Number(food.referenceQuantity)||1;
    quantity=Number(b.quantity||referenceQuantity);
    if(!quantity||quantity<=0)return NextResponse.json({error:"Quantidade inválida."},{status:400});

    const factor=quantity/referenceQuantity;
    name=food.name;
    unit=food.referenceUnit;
    calories=Number(food.calories)*factor;
    protein=Number(food.protein)*factor;
    carbs=Number(food.carbs)*factor;
    fat=Number(food.fat)*factor;
  }

  if(!name)return NextResponse.json({error:"Informe o alimento."},{status:400});

  const [row]=await db.insert(foodEntries).values({
    userId:u,
    logDate:b.logDate||new Date().toISOString().slice(0,10),
    mealType:b.mealType||"Refeição",
    name,
    quantity:String(quantity),
    unit,
    calories:String(Number(calories.toFixed(2))),
    protein:String(Number(protein.toFixed(2))),
    carbs:String(Number(carbs.toFixed(2))),
    fat:String(Number(fat.toFixed(2)))
  }).returning();

  return NextResponse.json(row,{status:201});
}
