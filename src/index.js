const express = require("express");
const cors = require("cors");
const { pool } = require("./db");

const app = express();
app.use(express.json());

// open CORS for now; tighten later
app.use(cors({ origin: true }));

app.get("/", (req, res) => res.send("PSA Core API alive"));

app.get("/db-test", async (req, res) => {
  try {
    const r = await pool.query("select now() as now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
