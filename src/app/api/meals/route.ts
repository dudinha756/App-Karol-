import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { foodEntries, foodLibrary, tacoFoods } from "@/lib/schema";
import { localDate, validLogDate } from "@/lib/dates";

const bad = (message: string) => NextResponse.json({ error: message }, { status: 400 });
const numeric = (v: unknown) => v === "" || v === null || v === undefined ? NaN : Number(v);
const healthy = (v: number, max = 100000) => Number.isFinite(v) && v >= 0 && v <= max;

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const date = new URL(req.url).searchParams.get("date") || localDate();
  if (!validLogDate(date)) return bad("Data inválida.");
  const db = getDb();
  return NextResponse.json(await db.select().from(foodEntries)
    .where(and(eq(foodEntries.userId, userId), eq(foodEntries.logDate, date)))
    .orderBy(desc(foodEntries.createdAt)));
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) || JSON.stringify(body).length > 5000) return bad("Dados inválidos.");
  const logDate = body.logDate ?? localDate();
  if (!validLogDate(logDate)) return bad("Data inválida.");
  const db = getDb();

  let name = String(body.name || "").trim();
  let quantity = numeric(body.quantity);
  let unit = String(body.unit || "porção").trim();
  let calories = numeric(body.calories ?? 0);
  let protein = numeric(body.protein ?? 0);
  let carbs = numeric(body.carbs ?? 0);
  let fat = numeric(body.fat ?? 0);

  if (body.tacoFoodId != null && body.tacoFoodId !== "") {
    const id = numeric(body.tacoFoodId);
    if (!Number.isInteger(id)) return bad("Alimento da TACO inválido.");
    const [food] = await db.select().from(tacoFoods).where(eq(tacoFoods.id, id)).limit(1);
    if (!food) return NextResponse.json({ error: "Alimento da TACO não encontrado." }, { status: 404 });
    if (!healthy(quantity, 5000) || quantity === 0) return bad("Informe a quantidade consumida em gramas.");
    const factor = quantity / 100;
    name = food.description;
    unit = "g";
    calories = Number(food.energyKcal || 0) * factor;
    protein = Number(food.proteinG || 0) * factor;
    carbs = Number(food.carbsG || 0) * factor;
    fat = Number(food.fatG || 0) * factor;
  } else if (body.foodId) {
    const [food] = await db.select().from(foodLibrary)
      .where(and(eq(foodLibrary.id, String(body.foodId)), eq(foodLibrary.userId, userId))).limit(1);
    if (!food) return NextResponse.json({ error: "Alimento não encontrado." }, { status: 404 });
    const reference = Number(food.referenceQuantity);
    quantity = numeric(body.quantity ?? food.referenceQuantity);
    if (!healthy(quantity, 5000) || quantity === 0 || !healthy(reference) || reference === 0) return bad("Quantidade inválida.");
    const factor = quantity / reference;
    name = food.name;
    unit = food.referenceUnit;
    calories = Number(food.calories) * factor;
    protein = Number(food.protein) * factor;
    carbs = Number(food.carbs) * factor;
    fat = Number(food.fat) * factor;
  }

  const mealType = String(body.mealType || "Refeição").trim();
  if (!name || name.length > 200 || !unit || unit.length > 30 || !mealType || mealType.length > 60) return bad("Dados do alimento inválidos.");
  if (!healthy(quantity, 5000) || quantity === 0) return bad("Quantidade inválida.");
  if (![calories, protein, carbs, fat].every(v => healthy(v, 10000))) return bad("Calorias ou macronutrientes inválidos.");

  const [row] = await db.insert(foodEntries).values({
    userId, logDate, mealType, name, quantity: String(quantity), unit,
    calories: calories.toFixed(2), protein: protein.toFixed(2),
    carbs: carbs.toFixed(2), fat: fat.toFixed(2)
  }).returning();
  return NextResponse.json(row, { status: 201 });
}
