import { NextResponse } from "next/server";
import { asc, ilike } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { tacoFoods } from "@/lib/schema";

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const q = normalize(new URL(req.url).searchParams.get("q") || "");
  const db = getDb();

  const rows = q
    ? await db.select().from(tacoFoods)
        .where(ilike(tacoFoods.searchName, `%${q}%`))
        .orderBy(asc(tacoFoods.description))
        .limit(30)
    : await db.select().from(tacoFoods)
        .orderBy(asc(tacoFoods.description))
        .limit(30);

  return NextResponse.json(rows);
}
