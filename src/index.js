const express = require("express");
const cors = require("cors");
const path = require("path");
const { pool } = require("./db");
const OpenAI = require("openai");

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

app.post("/api/login", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      success: false, 
      error: "Database not configured" 
    });
  }
  
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: "Email and password are required" 
    });
  }
  
  try {
    const result = await pool.query(
      "SELECT acct_id, email FROM accounts WHERE email = $1 AND password = $2",
      [email, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid email or password" 
      });
    }
    
    const account = result.rows[0];
    res.json({ 
      success: true, 
      acct_id: account.acct_id,
      email: account.email
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/dashboard/:acctId", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      success: false, 
      error: "Database not configured" 
    });
  }
  
  const { acctId } = req.params;
  
  try {
    // Get account info
    const accountResult = await pool.query(
      "SELECT email FROM accounts WHERE acct_id = $1",
      [acctId]
    );
    
    if (accountResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Account not found" 
      });
    }
    
    // Get client count for this account
    const clientResult = await pool.query(
      "SELECT COUNT(*) as count FROM clients WHERE acct_id = $1",
      [acctId]
    );
    
    // Get tax sales count for this account's clients
    const taxSaleResult = await pool.query(
      `SELECT COUNT(*) as count FROM tax_sales ts 
       INNER JOIN clients c ON ts.client_id = c.client_id 
       WHERE c.acct_id = $1`,
      [acctId]
    );
    
    // Get parcel count for this account's tax sales
    const parcelResult = await pool.query(
      `SELECT COUNT(*) as count FROM parcels p
       INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
       INNER JOIN clients c ON ts.client_id = c.client_id
       WHERE c.acct_id = $1`,
      [acctId]
    );
    
    res.json({
      success: true,
      email: accountResult.rows[0].email,
      clientCount: parseInt(clientResult.rows[0].count),
      taxSaleCount: parseInt(taxSaleResult.rows[0].count),
      parcelCount: parseInt(parcelResult.rows[0].count)
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/tax-sales/:acctId", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      success: false, 
      error: "Database not configured" 
    });
  }
  
  const { acctId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT ts.tax_sale_id, ts.tax_sale_name, ts.sale_date, ts.county, ts.status
       FROM tax_sales ts
       INNER JOIN clients c ON ts.client_id = c.client_id
       WHERE c.acct_id = $1
       ORDER BY ts.sale_date DESC`,
      [acctId]
    );
    
    res.json({ success: true, taxSales: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/parcels/:taxSaleId", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      success: false, 
      error: "Database not configured" 
    });
  }
  
  const { taxSaleId } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT parcel_id, file__, map_parcel, def
       FROM parcels
       WHERE tax_sale_id = $1
       ORDER BY parcel_id`,
      [taxSaleId]
    );
    
    res.json({ success: true, parcels: result.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get("/api/parcel/:parcelId", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      success: false, 
      error: "Database not configured" 
    });
  }
  
  const { parcelId } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT * FROM parcels WHERE parcel_id = $1",
      [parcelId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Parcel not found" 
      });
    }
    
    // Filter out null/empty fields
    const parcel = result.rows[0];
    const filteredParcel = {};
    
    for (const [key, value] of Object.entries(parcel)) {
      if (value !== null && value !== '') {
        filteredParcel[key] = value;
      }
    }
    
    res.json({ success: true, parcel: filteredParcel });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/chat", async (req, res) => {
  if (!pool) {
    return res.status(503).json({ 
      success: false, 
      error: "Database not configured" 
    });
  }
  
  const { message, acct_id } = req.body;
  
  if (!message || !acct_id) {
    return res.status(400).json({ 
      success: false, 
      error: "Message and account ID are required" 
    });
  }
  
  try {
    // Get user's parcel data for context
    const parcelsResult = await pool.query(
      `SELECT p.parcel_id, p.map_parcel, p.def, p.file__, p.county, 
              ts.tax_sale_name, ts.sale_date, ts.county as tax_sale_county
       FROM parcels p
       INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
       INNER JOIN clients c ON ts.client_id = c.client_id
       WHERE c.acct_id = $1
       LIMIT 500`,
      [acct_id]
    );
    
    // Get tax sales summary
    const taxSalesResult = await pool.query(
      `SELECT ts.tax_sale_id, ts.tax_sale_name, ts.sale_date, ts.county,
              COUNT(p.parcel_id) as parcel_count
       FROM tax_sales ts
       INNER JOIN clients c ON ts.client_id = c.client_id
       LEFT JOIN parcels p ON ts.tax_sale_id = p.tax_sale_id
       WHERE c.acct_id = $1
       GROUP BY ts.tax_sale_id, ts.tax_sale_name, ts.sale_date, ts.county`,
      [acct_id]
    );
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to simple keyword matching if no API key
      return res.json({ 
        success: true, 
        response: `AI chat requires an OPENAI_API_KEY environment variable. Please add it to enable intelligent responses.<br><br>You have ${parcelsResult.rows.length} total parcels across ${taxSalesResult.rows.length} tax sales.`
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const context = `You are a helpful assistant for a property tax sale management system. 
The user has access to the following data:

TAX SALES:
${taxSalesResult.rows.map(ts => 
  `- Tax Sale ${ts.tax_sale_id}: ${ts.tax_sale_name} (${ts.county || 'Unknown County'}, ${ts.sale_date ? new Date(ts.sale_date).toLocaleDateString() : 'No date'}) - ${ts.parcel_count} parcels`
).join('\n')}

TOTAL PARCELS: ${parcelsResult.rows.length}

Sample parcels (showing first 20):
${parcelsResult.rows.slice(0, 20).map(p => 
  `- Parcel ${p.parcel_id}: ${p.map_parcel || 'N/A'} in ${p.county || 'Unknown County'}, Defendant: ${p.def || 'N/A'}, File: ${p.file__ || 'N/A'}`
).join('\n')}

Answer the user's question about their parcels. Be concise and helpful. Use HTML line breaks (<br>) for formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const aiResponse = completion.choices[0].message.content;
    res.json({ success: true, response: aiResponse });
  } catch (e) {
    console.error('Chat error:', e);
    
    // Fallback response
    res.json({ 
      success: true, 
      response: "I'm having trouble processing your request. Please try asking about parcel counts, tax sales, or specific defendants."
    });
  }
});

const port = process.env.PORT || 3000;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(port, () => console.log(`Listening on ${port}`));
}

// Export for Vercel serverless
module.exports = app;
