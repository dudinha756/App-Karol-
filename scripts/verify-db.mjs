const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!url) {
  console.error("DATABASE_URL/POSTGRES_URL is not configured.");
  process.exit(1);
}

console.log("Database environment variable is present.");
