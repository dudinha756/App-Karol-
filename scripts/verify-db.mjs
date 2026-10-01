import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!url) {
  console.error("DATABASE_URL/POSTGRES_URL is not configured.");
  process.exit(1);
}

try {
  const sql = neon(url);
  await sql`SELECT 1 AS ok`;
  console.log("Database connection verified.");
} catch (error) {
  console.error("Database connection failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
