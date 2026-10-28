import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { ZodError } from "zod";
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
    const inviteToken = typeof raw.inviteToken === "string" ? raw.inviteToken.trim() : "";
    const email = body.email.trim().toLowerCase();

    if (Buffer.byteLength(body.password, "utf8") > 72) {
      return NextResponse.json({ error: "A senha é muito longa. Use até 72 bytes." }, { status: 400 });
    }

    const db = getDb();
    let inviteId: string | null = null;

    // Convites antigos continuam válidos, mas não são mais obrigatórios.
    if (inviteToken) {
      if (inviteToken.length < 20 || inviteToken.length > 200) {
        return NextResponse.json({ error: "Convite inválido ou expirado." }, { status: 403 });
      }

      const [invite] = await db.select({
        id: userInvitations.id
      }).from(userInvitations).where(and(
        eq(userInvitations.tokenHash, hashToken(inviteToken)),
        eq(userInvitations.email, email),
        isNull(userInvitations.usedAt),
        gt(userInvitations.expiresAt, new Date())
      )).limit(1);

      if (!invite) {
        return NextResponse.json({ error: "Convite inválido, expirado ou destinado a outro e-mail." }, { status: 403 });
      }
      inviteId = invite.id;
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    const [user] = await db.insert(users).values({
      name: body.name.trim(),
      email,
      passwordHash,
      canInvite: false
    }).onConflictDoNothing({ target: users.email }).returning({ id: users.id });

    if (!user) {
      return NextResponse.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
    }

    // Cada conta recebe um perfil próprio, sem alterar dados de outros usuários.
    try {
      await db.insert(profiles).values({ userId: user.id });
    } catch (error) {
      await db.delete(users).where(eq(users.id, user.id));
      throw error;
    }

    if (inviteId) {
      await db.update(userInvitations)
        .set({ usedAt: new Date() })
        .where(and(eq(userInvitations.id, inviteId), isNull(userInvitations.usedAt)));
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Dados inválidos." }, { status: 400 });
    }
    console.error("Falha ao criar conta no Forma day:", error);
    return NextResponse.json({ error: "Não foi possível criar a conta. Tente novamente." }, { status: 500 });
  }
}
