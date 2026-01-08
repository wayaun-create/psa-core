require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL is not set - database features will be disabled");
  module.exports = { pool: null };
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  module.exports = { pool };
}
