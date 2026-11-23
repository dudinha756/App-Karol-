import { NextResponse } from "next/server";
import { and, eq, desc } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles, workoutSessions } from "@/lib/schema";
import { estimateExerciseCalories } from "@/lib/energy";
import { localDate, validLogDate } from "@/lib/dates";

export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const date = new URL(req.url).searchParams.get("date") || localDate();
  if (!validLogDate(date)) return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  const db = getDb();
  return NextResponse.json(await db.select().from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.logDate, date)))
    .orderBy(desc(workoutSessions.createdAt)));
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body) || JSON.stringify(body).length > 3000)
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const type = String(body.type || "").trim();
  const minutes = Number(body.durationMinutes);
  const intensity = String(body.intensity || "moderate");
  const logDate = body.logDate ?? localDate();
  if (!type || type.length > 80 || !Number.isFinite(minutes) || minutes <= 0 || minutes > 600 ||
      !["light", "moderate", "high"].includes(intensity) || !validLogDate(logDate))
    return NextResponse.json({ error: "Informe treino, intensidade, data e duração válida (1 a 600 minutos)." }, { status: 400 });

  const db = getDb();
  const [profile] = await db.select({ weightKg: profiles.weightKg }).from(profiles)
    .where(eq(profiles.userId, userId)).limit(1);
  const weightKg = Number(profile?.weightKg || body.currentWeightKg || 60);
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300)
    return NextResponse.json({ error: "Peso inválido para a estimativa." }, { status: 400 });
  const kcal = estimateExerciseCalories({ type, minutes, weightKg, intensity });
  if (!Number.isFinite(kcal) || kcal < 0)
    return NextResponse.json({ error: "Não foi possível estimar o gasto." }, { status: 400 });
  const [row] = await db.insert(workoutSessions).values({
    userId, logDate, type, durationMinutes: minutes, intensity,
    caloriesEstimated: String(kcal)
  }).returning();
  return NextResponse.json(row, { status: 201 });
}
