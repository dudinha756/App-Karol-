import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!url) {
  // Previews sem banco configurado ainda devem compilar para validar o código.
  // Produção continua exigindo uma conexão real antes de publicar.
  if (process.env.VERCEL_ENV === "preview") {
    console.warn("Preview sem DATABASE_URL: verificação do banco ignorada. APIs que usam banco não funcionarão neste preview.");
    process.exit(0);
  }
  console.error("DATABASE_URL/POSTGRES_URL is not configured.");
  process.exit(1);
}

try {
  const sql = neon(url);
  const result = await sql`SELECT current_database() AS db, 1 AS ok`;
  if (!result?.[0] || result[0].ok !== 1) {
    console.error("Unexpected database verification result.");
    process.exit(1);
  }
  console.log(`Neon database connection verified: ${result[0].db}`);
} catch (error) {
  console.error("Database connection failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
