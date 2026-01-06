const { pool } = require("../src/db");

async function main() {
  console.log("Worker alive");

  // simple DB ping so you know it connects
  const r = await pool.query("select now() as now");
  console.log("DB time:", r.rows[0].now);

  // exit for now (cron style). Later we can make it loop.
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
