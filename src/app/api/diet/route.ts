import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import pdf from "pdf-parse";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  dietDocuments,
  dietMeals,
  dietMealChecks,
  dietChoiceGroups,
  dietChoiceOptions,
  dietOptionSelections
} from "@/lib/schema";
import { parseDietText } from "@/lib/diet-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const today = () => new Date().toISOString().slice(0, 10);

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const date = new URL(req.url).searchParams.get("date") || today();
  const db = getDb();

  const [doc] = await db
    .select()
    .from(dietDocuments)
    .where(eq(dietDocuments.userId, userId))
    .orderBy(desc(dietDocuments.uploadedAt))
    .limit(1);

  if (!doc) {
    return NextResponse.json({
      document: null,
      meals: [],
      completedCount: 0,
      totalCalories: 0,
      selectedNutrition: zeroNutrition(),
      completedNutrition: zeroNutrition()
    });
  }

  const meals = await db
    .select()
    .from(dietMeals)
    .where(and(eq(dietMeals.userId, userId), eq(dietMeals.documentId, doc.id)))
    .orderBy(dietMeals.sortOrder);

  const mealIds = meals.map(m => m.id);

  const checks = mealIds.length ? await db
    .select()
    .from(dietMealChecks)
    .where(and(
      eq(dietMealChecks.userId, userId),
      eq(dietMealChecks.logDate, date),
      inArray(dietMealChecks.mealId, mealIds)
    )) : [];

  const groups = mealIds.length ? await db
    .select()
    .from(dietChoiceGroups)
    .where(and(
      eq(dietChoiceGroups.userId, userId),
      inArray(dietChoiceGroups.mealId, mealIds)
    ))
    .orderBy(dietChoiceGroups.sortOrder) : [];

  const groupIds = groups.map(g => g.id);

  const options = groupIds.length ? await db
    .select()
    .from(dietChoiceOptions)
    .where(and(
      eq(dietChoiceOptions.userId, userId),
      inArray(dietChoiceOptions.groupId, groupIds)
    ))
    .orderBy(dietChoiceOptions.sortOrder) : [];

  const selections = mealIds.length ? await db
    .select()
    .from(dietOptionSelections)
    .where(and(
      eq(dietOptionSelections.userId, userId),
      eq(dietOptionSelections.logDate, date),
      inArray(dietOptionSelections.mealId, mealIds)
    )) : [];

  const checkMap = new Map(checks.map(c => [c.mealId, c]));
  const selectionMap = new Map(selections.map(s => [s.optionId, s]));

  const result = meals.map(meal => {
    const mealGroups = groups
      .filter(group => group.mealId === meal.id)
      .map(group => {
        const groupOptions = options
          .filter(option => option.groupId === group.id)
          .map(option => {
            const selection = selectionMap.get(option.id);
            const quantity = Number(selection?.quantity ?? option.defaultQuantity);
            const selected = Boolean(selection?.selected);
            return {
              ...option,
              selected,
              quantity,
              nutrition: calculateNutrition(option, quantity)
            };
          });

        return {
          ...group,
          options: groupOptions,
          selectedOptionId: groupOptions.find(option => option.selected)?.id ?? null
        };
      });

    const selectedOptions = mealGroups.flatMap(group => group.options.filter(option => option.selected));
    const nutrition = selectedOptions.reduce((sum, option) => addNutrition(sum, option.nutrition), zeroNutrition());
    const completed = checkMap.get(meal.id)?.completed ?? false;

    return {
      ...meal,
      items: safeItems(meal.itemsJson),
      groups: mealGroups,
      hasChoiceGroups: mealGroups.length > 0,
      selectedCount: selectedOptions.length,
      nutrition,
      completed,
      completedAt: checkMap.get(meal.id)?.completedAt ?? null
    };
  });

  const selectedNutrition = result.reduce((sum, meal) => addNutrition(sum, meal.nutrition), zeroNutrition());
  const completedNutrition = result
    .filter(meal => meal.completed)
    .reduce((sum, meal) => addNutrition(sum, meal.nutrition), zeroNutrition());

  return NextResponse.json({
    document: { id: doc.id, fileName: doc.fileName, uploadedAt: doc.uploadedAt },
    meals: result,
    completedCount: result.filter(m => m.completed).length,
    totalCalories: result.reduce((sum, m) => sum + Number(m.calories), 0),
    selectedNutrition,
    completedNutrition
  });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Selecione um arquivo PDF." }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "O arquivo precisa ser um PDF." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "O PDF deve ter no máximo 10 MB." }, { status: 400 });
  }

  try {
    const parsed = await pdf(Buffer.from(await file.arrayBuffer()));
    const text = parsed.text?.trim() || "";

    if (text.length < 20) {
      return NextResponse.json({
        error: "Não consegui ler texto suficiente deste PDF. Se ele for escaneado como imagem, exporte uma versão com texto selecionável."
      }, { status: 422 });
    }

    const meals = parseDietText(text);
    if (!meals.length) {
      return NextResponse.json({
        error: "Li o PDF, mas não consegui identificar as refeições. Tente um PDF com títulos como Café da manhã, Almoço, Lanche ou Jantar."
      }, { status: 422 });
    }

    const db = getDb();
    const [doc] = await db.insert(dietDocuments).values({
      userId,
      fileName: file.name.slice(0, 250),
      rawText: text.slice(0, 120000)
    }).returning();

    await db.insert(dietMeals).values(meals.map((meal, index) => ({
      userId,
      documentId: doc.id,
      sortOrder: index,
      name: meal.name,
      scheduledTime: meal.scheduledTime || null,
      calories: String(meal.calories || 0),
      itemsJson: JSON.stringify(meal.items),
      calculationNote: meal.note
    })));

    return NextResponse.json({
      ok: true,
      documentId: doc.id,
      mealsFound: meals.length,
      totalCalories: meals.reduce((sum, meal) => sum + meal.calories, 0)
    }, { status: 201 });
  } catch (error) {
    console.error("diet pdf parse failed", error);
    return NextResponse.json({ error: "Não consegui processar esse PDF." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const mealId = String(body.mealId || "");
  const calories = Number(body.calories);

  if (!mealId || !Number.isFinite(calories) || calories < 0 || calories > 10000) {
    return NextResponse.json({ error: "Valor de calorias inválido." }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db.update(dietMeals)
    .set({ calories: String(Math.round(calories)), calculationNote: "Calorias ajustadas manualmente." })
    .where(and(eq(dietMeals.id, mealId), eq(dietMeals.userId, userId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Refeição não encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true, meal: updated });
}

function calculateNutrition(option: any, quantity: number) {
  const reference = Number(option.referenceQuantity) || 1;
  const factor = quantity / reference;
  return {
    calories: Number(option.caloriesRef) * factor,
    protein: Number(option.proteinRef) * factor,
    carbs: Number(option.carbsRef) * factor,
    fat: Number(option.fatRef) * factor
  };
}

function zeroNutrition() {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

function addNutrition(a: any, b: any) {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat
  };
}

function safeItems(value: string) {
  try {
    const x = JSON.parse(value);
    return Array.isArray(x) ? x.map(String) : [];
  } catch {
    return [];
  }
}
