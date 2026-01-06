const express = require("express");
const cors = require("cors");
const path = require("path");
const { pool } = require("./db");

const app = express();
app.use(express.json());

// open CORS for now; tighten later
app.use(cors({ origin: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api", (req, res) => res.send("PSA Core API alive"));

app.get("/api/db-test", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      ok: false, 
      error: "Database not configured. Set DATABASE_URL in .env file" 
    });
  }
  
  try {
    const r = await pool.query("select now() as now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Catch-all route for SPA - serve index.html for any unmatched routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
