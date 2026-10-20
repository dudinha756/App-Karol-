import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, profiles, userInvitations } from "@/lib/schema";
import { registerSchema } from "@/lib/validation";
import { createSession } from "@/lib/auth";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const body = registerSchema.parse(raw);
    const inviteToken = String(raw.inviteToken || "");

    if (inviteToken.length < 20) {
      return NextResponse.json({ error: "Cadastro disponível somente por convite." }, { status: 403 });
    }

    const db = getDb();
    const email = body.email.trim().toLowerCase();

    const [invite] = await db.select({
      id: userInvitations.id,
      email: userInvitations.email
    }).from(userInvitations).where(and(
      eq(userInvitations.tokenHash, hashToken(inviteToken)),
      eq(userInvitations.email, email),
      isNull(userInvitations.usedAt),
      gt(userInvitations.expiresAt, new Date())
    )).limit(1);

    if (!invite) {
      return NextResponse.json({ error: "Convite inválido, expirado ou destinado a outro e-mail." }, { status: 403 });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(users).values({
      name: body.name.trim(),
      email,
      passwordHash,
      canInvite: false
    }).returning({ id: users.id });

    await db.insert(profiles).values({ userId: user.id });
    await db.update(userInvitations).set({ usedAt: new Date() }).where(eq(userInvitations.id, invite.id));
    await createSession(user.id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message = e?.issues?.[0]?.message || e?.message || "Não foi possível criar a conta.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
