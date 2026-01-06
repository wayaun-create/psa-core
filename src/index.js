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
    const lowerMsg = message.toLowerCase();
    let response = '';
    
    // Count queries
    if (lowerMsg.includes('how many') || lowerMsg.includes('count')) {
      // Check what they're counting
      if (lowerMsg.includes('parcel')) {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM parcels p
           INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
           INNER JOIN clients c ON ts.client_id = c.client_id
           WHERE c.acct_id = $1`,
          [acct_id]
        );
        response = `You have ${result.rows[0].count} total parcels.`;
      } else if (lowerMsg.includes('tax sale')) {
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM tax_sales ts
           INNER JOIN clients c ON ts.client_id = c.client_id
           WHERE c.acct_id = $1`,
          [acct_id]
        );
        response = `You have ${result.rows[0].count} tax sales.`;
      }
      
      // County-specific count
      const countyMatch = lowerMsg.match(/in ([a-z]+) county/i);
      if (countyMatch) {
        const county = countyMatch[1];
        const result = await pool.query(
          `SELECT COUNT(*) as count FROM parcels p
           INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
           INNER JOIN clients c ON ts.client_id = c.client_id
           WHERE c.acct_id = $1 AND LOWER(p.county) = LOWER($2)`,
          [acct_id, county]
        );
        response = `You have ${result.rows[0].count} parcels in ${county.charAt(0).toUpperCase() + county.slice(1)} County.`;
      }
    }
    
    // Search for specific defendant
    else if (lowerMsg.includes('defendant') || lowerMsg.includes('show me')) {
      // Extract potential name from query
      const nameMatch = lowerMsg.match(/defendant\s+(.+)|show\s+me\s+parcels?\s+(?:with|for)\s+(.+)/i);
      if (nameMatch) {
        const searchTerm = (nameMatch[1] || nameMatch[2]).trim();
        const result = await pool.query(
          `SELECT p.parcel_id, p.map_parcel, p.def, p.file__, ts.tax_sale_name
           FROM parcels p
           INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
           INNER JOIN clients c ON ts.client_id = c.client_id
           WHERE c.acct_id = $1 AND LOWER(p.def) LIKE LOWER($2)
           LIMIT 10`,
          [acct_id, `%${searchTerm}%`]
        );
        
        if (result.rows.length > 0) {
          response = `Found ${result.rows.length} parcel(s):<br>` + 
            result.rows.map(p => 
              `• ${p.map_parcel || 'N/A'} - ${p.def || 'No defendant'} (File: ${p.file__ || 'N/A'})`
            ).join('<br>');
        } else {
          response = `No parcels found matching "${searchTerm}".`;
        }
      }
    }
    
    // Search by tax sale ID
    else if (lowerMsg.match(/tax sale\s+(\d+)/i)) {
      const taxSaleMatch = lowerMsg.match(/tax sale\s+(\d+)/i);
      const taxSaleId = taxSaleMatch[1];
      const result = await pool.query(
        `SELECT COUNT(*) as count, ts.tax_sale_name
         FROM parcels p
         INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
         INNER JOIN clients c ON ts.client_id = c.client_id
         WHERE c.acct_id = $1 AND ts.tax_sale_id = $2
         GROUP BY ts.tax_sale_name`,
        [acct_id, taxSaleId]
      );
      
      if (result.rows.length > 0) {
        response = `Tax Sale ${taxSaleId} (${result.rows[0].tax_sale_name}) has ${result.rows[0].count} parcels.`;
      } else {
        response = `No parcels found for tax sale ${taxSaleId}.`;
      }
    }
    
    // Default response
    if (!response) {
      response = `I can help you with:<br>
        • Counting parcels (e.g., "How many parcels in Butts County?")<br>
        • Finding defendants (e.g., "Show me parcels with defendant Smith")<br>
        • Tax sale information (e.g., "What parcels are in tax sale 99?")`;
    }
    
    res.json({ success: true, response });
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
