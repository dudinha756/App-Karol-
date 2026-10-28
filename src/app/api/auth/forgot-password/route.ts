import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { passwordResetCodes, users } from "@/lib/schema";
import { sendPasswordResetCode } from "@/lib/email";

function normalizeEmail(value:string){
  return value.trim().toLowerCase();
}
function hashCode(email:string,code:string){
  const secret=process.env.AUTH_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL || "app-karol-reset";
  return createHash("sha256").update(email+":"+code+":"+secret).digest("hex");
}
function generic(){
  return NextResponse.json({
    ok:true,
    message:"Se esse e-mail estiver cadastrado, você receberá um código em instantes."
  });
}

export async function POST(req:Request){
  if(!process.env.RESEND_API_KEY){
    return NextResponse.json({error:"O envio de e-mail ainda não foi configurado no App Karol."},{status:503});
  }

  const body=await req.json().catch(function(){return {}});
  const email=normalizeEmail(String(body.email||""));
  if(!/^\S+@\S+\.\S+$/.test(email)){
    return NextResponse.json({error:"Informe um e-mail válido."},{status:400});
  }

  const db=getDb();
  const [user]=await db.select({id:users.id,email:users.email})
    .from(users).where(eq(users.email,email)).limit(1);

  if(!user)return generic();

  const [recent]=await db.select({createdAt:passwordResetCodes.createdAt})
    .from(passwordResetCodes)
    .where(and(
      eq(passwordResetCodes.userId,user.id),
      isNull(passwordResetCodes.usedAt),
      gt(passwordResetCodes.expiresAt,new Date())
    ))
    .orderBy(desc(passwordResetCodes.createdAt))
    .limit(1);

  if(recent && Date.now()-new Date(recent.createdAt).getTime()<60_000){
    return generic();
  }

  const code=String(randomInt(100000,1000000));
  const expiresAt=new Date(Date.now()+10*60*1000);

  const [row]=await db.insert(passwordResetCodes).values({
    userId:user.id,
    email,
    codeHash:hashCode(email,code),
    expiresAt
  }).returning({id:passwordResetCodes.id});

  try{
    await sendPasswordResetCode(email,code);
  }catch(error){
    await db.delete(passwordResetCodes).where(eq(passwordResetCodes.id,row.id));
    console.error("password reset request failed",error);
    return NextResponse.json({error:"Não foi possível enviar o código agora. Tente novamente em alguns minutos."},{status:503});
  }

  return generic();
}
