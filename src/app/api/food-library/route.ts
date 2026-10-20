import { NextResponse } from "next/server";
import { asc, and, eq, ilike } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { foodLibrary } from "@/lib/schema";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  const db = getDb();
  const where = q
    ? and(eq(foodLibrary.userId, userId), ilike(foodLibrary.name, `%${q}%`))
    : eq(foodLibrary.userId, userId);

  const rows = await db.select().from(foodLibrary).where(where).orderBy(asc(foodLibrary.name));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  const referenceQuantity = Number(body.referenceQuantity);
  const referenceUnit = String(body.referenceUnit || "g").trim();
  const protein = Number(body.protein || 0);
  const carbs = Number(body.carbs || 0);
  const fat = Number(body.fat || 0);
  const enteredCalories = body.calories === "" || body.calories == null ? NaN : Number(body.calories);
  const calories = Number.isFinite(enteredCalories) ? enteredCalories : protein * 4 + carbs * 4 + fat * 9;

  if (!name || !referenceQuantity || referenceQuantity <= 0) {
    return NextResponse.json({ error: "Informe o alimento e a porção de referência." }, { status: 400 });
  }

  for (const value of [calories, protein, carbs, fat]) {
    if (!Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: "Macros inválidos." }, { status: 400 });
    }
  }

  const db = getDb();
  const [row] = await db.insert(foodLibrary).values({
    userId,
    name,
    referenceQuantity: String(referenceQuantity),
    referenceUnit: referenceUnit || "g",
    calories: String(calories),
    protein: String(protein),
    carbs: String(carbs),
    fat: String(fat)
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
