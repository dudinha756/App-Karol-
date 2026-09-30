import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { profiles, weightLogs } from "@/lib/schema";
import { profileSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const userId = await getSessionUserId(); if (!userId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  try {
    const p = profileSchema.parse(await req.json()); const db = getDb();
    await db.update(profiles).set({ age:p.age, sex:p.sex, heightCm:String(p.heightCm), weightKg:String(p.weightKg), goal:p.goal, baselineActivity:p.baselineActivity, onboardingDone:true, updatedAt:new Date() }).where(eq(profiles.userId,userId));
    await db.insert(weightLogs).values({ userId, logDate:new Date().toISOString().slice(0,10), weightKg:String(p.weightKg) });
    return NextResponse.json({ok:true});
  } catch(e:any){return NextResponse.json({error:e?.issues?.[0]?.message||"Dados inválidos."},{status:400})}
}
