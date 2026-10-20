import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { users, userInvitations } from "@/lib/schema";

const emailSchema = z.string().email("E-mail inválido.");

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const db = getDb();
  const [me] = await db.select({ canInvite: users.canInvite }).from(users).where(eq(users.id, userId)).limit(1);
  if (!me?.canInvite) return NextResponse.json({ error: "Sem permissão para convidar usuários." }, { status: 403 });

  const rows = await db.select({
    id: userInvitations.id,
    email: userInvitations.email,
    expiresAt: userInvitations.expiresAt,
    usedAt: userInvitations.usedAt,
    createdAt: userInvitations.createdAt
  }).from(userInvitations)
    .where(eq(userInvitations.invitedBy, userId))
    .orderBy(desc(userInvitations.createdAt))
    .limit(30);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const db = getDb();
  const [me] = await db.select({ canInvite: users.canInvite }).from(users).where(eq(users.id, userId)).limit(1);
  if (!me?.canInvite) return NextResponse.json({ error: "Sem permissão para convidar usuários." }, { status: 403 });

  const body = await req.json();
  const email = emailSchema.parse(String(body.email || "").trim().toLowerCase());

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });

  await db.delete(userInvitations).where(and(
    eq(userInvitations.email, email),
    eq(userInvitations.invitedBy, userId),
    isNull(userInvitations.usedAt)
  ));

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(userInvitations).values({
    email,
    tokenHash: hashToken(token),
    invitedBy: userId,
    expiresAt
  });

  const origin = new URL(req.url).origin;
  const inviteUrl = `${origin}/register?invite=${encodeURIComponent(token)}`;

  return NextResponse.json({ ok: true, email, inviteUrl, expiresAt });
}
