import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { foodEntries } from "@/lib/schema";
import { localDate, previousDate } from "@/lib/dates";

/** Repeat yesterday's meals into today's calendar, without sharing data across users. */
export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const today = localDate();
  const yesterday = previousDate(today);
  const db = getDb();
  const prior = await db.select().from(foodEntries).where(and(eq(foodEntries.userId, userId), eq(foodEntries.logDate, yesterday))).limit(100);
  if (!prior.length) return NextResponse.json({ error: "Você não registrou refeições ontem." }, { status: 404 });
  // Avoid blindly duplicating an entire day through accidental repeat clicks.
  const current = await db.select({ id: foodEntries.id }).from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.logDate, today))).limit(1);
  if (current.length) return NextResponse.json({ error: "O dia de hoje já tem refeições. Para evitar duplicidades, copie individualmente." }, { status: 409 });
  const copied = await db.insert(foodEntries).values(prior.map(f => ({
    userId, logDate: today, mealType: f.mealType, name: f.name,
    quantity: f.quantity, unit: f.unit, calories: f.calories,
    protein: f.protein, carbs: f.carbs, fat: f.fat
  }))).returning({ id: foodEntries.id });
  return NextResponse.json({ ok: true, count: copied.length }, { status: 201 });
}
