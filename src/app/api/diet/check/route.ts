import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { dietMeals, dietMealChecks } from "@/lib/schema";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const mealId = String(body.mealId || "");
  const logDate = String(body.logDate || new Date().toISOString().slice(0, 10));
  const completed = Boolean(body.completed);

  if (!mealId || !/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const db = getDb();
  const [meal] = await db.select({ id: dietMeals.id })
    .from(dietMeals)
    .where(and(eq(dietMeals.id, mealId), eq(dietMeals.userId, userId)))
    .limit(1);

  if (!meal) return NextResponse.json({ error: "Refeição não encontrada." }, { status: 404 });

  const existing = await db.select()
    .from(dietMealChecks)
    .where(and(
      eq(dietMealChecks.userId, userId),
      eq(dietMealChecks.mealId, mealId),
      eq(dietMealChecks.logDate, logDate)
    ))
    .limit(1);

  if (existing[0]) {
    await db.update(dietMealChecks)
      .set({ completed, completedAt: completed ? new Date() : null })
      .where(eq(dietMealChecks.id, existing[0].id));
  } else {
    await db.insert(dietMealChecks).values({
      userId,
      mealId,
      logDate,
      completed,
      completedAt: completed ? new Date() : null
    });
  }

  return NextResponse.json({ ok: true, completed });
}
