import { Pool } from 'pg';

// Create a singleton pool instance
let pool: Pool | null = null;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set - database features will be disabled");
  pool = null;
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : undefined,
  });
}

export { pool };
