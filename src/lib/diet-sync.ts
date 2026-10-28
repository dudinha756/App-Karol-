import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  dietMealChecks,
  dietMeals,
  dietOptionSelections,
  dietChoiceOptions,
  foodEntries
} from "@/lib/schema";

export async function syncDietMealToFoodEntries(userId:string, mealId:string, logDate:string) {
  const db=getDb();

  await db.delete(foodEntries).where(and(
    eq(foodEntries.userId,userId),
    eq(foodEntries.logDate,logDate),
    eq(foodEntries.sourceType,"diet"),
    eq(foodEntries.sourceRef,mealId)
  ));

  const [check]=await db.select({completed:dietMealChecks.completed})
    .from(dietMealChecks)
    .where(and(
      eq(dietMealChecks.userId,userId),
      eq(dietMealChecks.mealId,mealId),
      eq(dietMealChecks.logDate,logDate)
    )).limit(1);

  if(!check?.completed)return;

  const [meal]=await db.select({name:dietMeals.name})
    .from(dietMeals)
    .where(and(eq(dietMeals.id,mealId),eq(dietMeals.userId,userId)))
    .limit(1);
  if(!meal)return;

  const selections=await db.select()
    .from(dietOptionSelections)
    .where(and(
      eq(dietOptionSelections.userId,userId),
      eq(dietOptionSelections.mealId,mealId),
      eq(dietOptionSelections.logDate,logDate),
      eq(dietOptionSelections.selected,true)
    ));

  const optionIds=selections.map(s=>s.optionId);
  if(!optionIds.length)return;

  const options=await db.select()
    .from(dietChoiceOptions)
    .where(and(
      eq(dietChoiceOptions.userId,userId),
      inArray(dietChoiceOptions.id,optionIds)
    ));

  const rows=selections.flatMap(selection=>{
    const option=options.find(o=>o.id===selection.optionId);
    if(!option)return [];
    const quantity=Number(selection.quantity);
    const reference=Number(option.referenceQuantity)||1;
    const factor=quantity/reference;
    return [{
      userId,
      logDate,
      mealType:meal.name,
      name:option.name,
      quantity:String(quantity),
      unit:option.unit,
      calories:String(Number((Number(option.caloriesRef)*factor).toFixed(2))),
      protein:String(Number((Number(option.proteinRef)*factor).toFixed(2))),
      carbs:String(Number((Number(option.carbsRef)*factor).toFixed(2))),
      fat:String(Number((Number(option.fatRef)*factor).toFixed(2))),
      sourceType:"diet",
      sourceRef:mealId
    }];
  });

  if(rows.length)await db.insert(foodEntries).values(rows);
}
