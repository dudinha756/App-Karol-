import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userInvitations } from "@/lib/schema";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  if (token.length < 20) return NextResponse.json({ valid: false }, { status: 400 });

  const db = getDb();
  const [invite] = await db.select({
    email: userInvitations.email,
    expiresAt: userInvitations.expiresAt
  }).from(userInvitations).where(and(
    eq(userInvitations.tokenHash, hashToken(token)),
    isNull(userInvitations.usedAt),
    gt(userInvitations.expiresAt, new Date())
  )).limit(1);

  if (!invite) return NextResponse.json({ valid: false }, { status: 404 });
  return NextResponse.json({ valid: true, email: invite.email, expiresAt: invite.expiresAt });
}
