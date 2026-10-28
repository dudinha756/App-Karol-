import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { passwordResetCodes, users } from "@/lib/schema";

function normalizeEmail(value:string){
  return value.trim().toLowerCase();
}
function hashCode(email:string,code:string){
  const secret=process.env.AUTH_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL || "app-karol-reset";
  return createHash("sha256").update(email+":"+code+":"+secret).digest("hex");
}

export async function POST(req:Request){
  const body=await req.json().catch(function(){return {}});
  const email=normalizeEmail(String(body.email||""));
  const code=String(body.code||"").replace(/\D/g,"");
  const password=String(body.password||"");

  if(!/^\S+@\S+\.\S+$/.test(email))return NextResponse.json({error:"E-mail inválido."},{status:400});
  if(!/^\d{6}$/.test(code))return NextResponse.json({error:"Digite o código de 6 dígitos."},{status:400});
  if(password.length<8)return NextResponse.json({error:"A nova senha deve ter pelo menos 8 caracteres."},{status:400});

  const db=getDb();
  const [user]=await db.select({id:users.id}).from(users).where(eq(users.email,email)).limit(1);
  if(!user)return NextResponse.json({error:"Código inválido ou expirado."},{status:400});

  const [reset]=await db.select().from(passwordResetCodes)
    .where(and(
      eq(passwordResetCodes.userId,user.id),
      eq(passwordResetCodes.email,email),
      isNull(passwordResetCodes.usedAt),
      gt(passwordResetCodes.expiresAt,new Date())
    ))
    .orderBy(desc(passwordResetCodes.createdAt))
    .limit(1);

  if(!reset||reset.attempts>=5){
    return NextResponse.json({error:"Código inválido ou expirado."},{status:400});
  }

  const valid=reset.codeHash===hashCode(email,code);
  if(!valid){
    const attempts=reset.attempts+1;
    await db.update(passwordResetCodes)
      .set({attempts,usedAt:attempts>=5?new Date():null})
      .where(eq(passwordResetCodes.id,reset.id));
    return NextResponse.json({error:attempts>=5?"Código bloqueado após muitas tentativas. Solicite um novo.":"Código incorreto."},{status:400});
  }

  const passwordHash=await bcrypt.hash(password,12);
  await db.update(users).set({passwordHash}).where(eq(users.id,user.id));
  await db.update(passwordResetCodes)
    .set({usedAt:new Date()})
    .where(and(eq(passwordResetCodes.userId,user.id),isNull(passwordResetCodes.usedAt)));

  return NextResponse.json({ok:true});
}
