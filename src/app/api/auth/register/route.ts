import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, profiles } from "@/lib/schema";
import { registerSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = registerSchema.parse(await req.json());
    const db = getDb();
    const email = body.email.trim().toLowerCase();
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(users).values({ name: body.name.trim(), email, passwordHash }).returning({ id: users.id });
    await db.insert(profiles).values({ userId: user.id });
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message = e?.issues?.[0]?.message || e?.message || "Não foi possível criar a conta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
