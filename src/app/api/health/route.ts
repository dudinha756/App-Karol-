import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!url) {
    return NextResponse.json(
      { ok: false, database: false, error: "database_not_configured" },
      { status: 503 }
    );
  }

  try {
    const sql = neon(url);
    await sql`SELECT 1 AS ok`;

    return NextResponse.json({
      ok: true,
      database: true,
      service: "app-karol"
    });
  } catch {
    return NextResponse.json(
      { ok: false, database: false, error: "database_unreachable" },
      { status: 503 }
    );
  }
}
