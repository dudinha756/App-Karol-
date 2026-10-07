import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import pdf from "pdf-parse";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { dietDocuments, dietMeals, dietMealChecks } from "@/lib/schema";
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

  if (!doc) return NextResponse.json({ document: null, meals: [], completedCount: 0, totalCalories: 0 });

  const meals = await db
    .select()
    .from(dietMeals)
    .where(and(eq(dietMeals.userId, userId), eq(dietMeals.documentId, doc.id)))
    .orderBy(dietMeals.sortOrder);

  const checks = await db
    .select()
    .from(dietMealChecks)
    .where(and(eq(dietMealChecks.userId, userId), eq(dietMealChecks.logDate, date)));

  const checkMap = new Map(checks.map(c => [c.mealId, c]));
  const result = meals.map(m => ({
    ...m,
    items: safeItems(m.itemsJson),
    completed: checkMap.get(m.id)?.completed ?? false,
    completedAt: checkMap.get(m.id)?.completedAt ?? null
  }));

  return NextResponse.json({
    document: { id: doc.id, fileName: doc.fileName, uploadedAt: doc.uploadedAt },
    meals: result,
    completedCount: result.filter(m => m.completed).length,
    totalCalories: result.reduce((sum, m) => sum + Number(m.calories), 0)
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

function safeItems(value: string) {
  try {
    const x = JSON.parse(value);
    return Array.isArray(x) ? x.map(String) : [];
  } catch {
    return [];
  }
}
