import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, profiles } from "@/lib/schema";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";
import { allowAttempt } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!allowAttempt("login:" + ip + ":" + body.email.trim().toLowerCase(), 8)) {
      return NextResponse.json({ error: "Muitas tentativas. Tente novamente em 15 minutos." }, { status: 429 });
    }
    const db = getDb();
    const rows = await db.select({ id: users.id, passwordHash: users.passwordHash, onboardingDone: profiles.onboardingDone })
      .from(users).leftJoin(profiles, eq(users.id, profiles.userId)).where(eq(users.email, body.email.trim().toLowerCase())).limit(1);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    await createSession(user.id);
    return NextResponse.json({ ok: true, onboardingDone: !!user.onboardingDone });
  } catch { return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 400 }); }
}
