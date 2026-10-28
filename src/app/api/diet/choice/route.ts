import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  dietChoiceGroups,
  dietChoiceOptions,
  dietOptionSelections
} from "@/lib/schema";
import { syncDietMealToFoodEntries } from "@/lib/diet-sync";

export async function POST(req:Request){
  const userId=await getSessionUserId();
  if(!userId)return NextResponse.json({error:"Não autenticado"},{status:401});

  const b=await req.json();
  const mealId=String(b.mealId||"");
  const groupId=String(b.groupId||"");
  const optionId=String(b.optionId||"");
  const logDate=String(b.logDate||"");
  const selected=Boolean(b.selected);
  const quantity=Number(b.quantity);

  if(!mealId||!groupId||!optionId||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(logDate)){
    return NextResponse.json({error:"Dados inválidos."},{status:400});
  }
  if(!Number.isFinite(quantity)||quantity<=0||quantity>5000){
    return NextResponse.json({error:"Quantidade inválida."},{status:400});
  }

  const db=getDb();
  const [option]=await db.select({
    id:dietChoiceOptions.id,
    mealId:dietChoiceOptions.mealId,
    groupId:dietChoiceOptions.groupId
  }).from(dietChoiceOptions).where(and(
    eq(dietChoiceOptions.id,optionId),
    eq(dietChoiceOptions.userId,userId),
    eq(dietChoiceOptions.mealId,mealId),
    eq(dietChoiceOptions.groupId,groupId)
  )).limit(1);

  if(!option)return NextResponse.json({error:"Opção não encontrada."},{status:404});

  const [group]=await db.select({selectionType:dietChoiceGroups.selectionType})
    .from(dietChoiceGroups).where(and(
      eq(dietChoiceGroups.id,groupId),
      eq(dietChoiceGroups.userId,userId),
      eq(dietChoiceGroups.mealId,mealId)
    )).limit(1);

  if(!group)return NextResponse.json({error:"Grupo não encontrado."},{status:404});

  if(selected&&group.selectionType==="single"){
    await db.update(dietOptionSelections)
      .set({selected:false,updatedAt:new Date()})
      .where(and(
        eq(dietOptionSelections.userId,userId),
        eq(dietOptionSelections.groupId,groupId),
        eq(dietOptionSelections.logDate,logDate)
      ));
  }

  const [existing]=await db.select({id:dietOptionSelections.id})
    .from(dietOptionSelections).where(and(
      eq(dietOptionSelections.userId,userId),
      eq(dietOptionSelections.optionId,optionId),
      eq(dietOptionSelections.logDate,logDate)
    )).limit(1);

  if(existing){
    await db.update(dietOptionSelections).set({
      selected,
      quantity:String(quantity),
      updatedAt:new Date()
    }).where(eq(dietOptionSelections.id,existing.id));
  }else{
    await db.insert(dietOptionSelections).values({
      userId,mealId,groupId,optionId,logDate,selected,quantity:String(quantity)
    });
  }

  await syncDietMealToFoodEntries(userId,mealId,logDate);
  return NextResponse.json({ok:true});
}
