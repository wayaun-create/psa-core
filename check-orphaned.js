const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

(async () => {
  try {
    // Check for orphaned client_id in tax_sales
    const orphanedTaxSales = await pool.query(`
      SELECT DISTINCT ts.client_id
      FROM tax_sales ts
      LEFT JOIN clients c ON ts.client_id = c.client_id
      WHERE ts.client_id IS NOT NULL 
      AND c.client_id IS NULL
    `);
    
    console.log('Orphaned client_ids in tax_sales:', orphanedTaxSales.rows);
    
    // Check for orphaned acct_id in clients
    const orphanedClients = await pool.query(`
      SELECT DISTINCT c.acct_id
      FROM clients c
      LEFT JOIN accounts a ON c.acct_id = a.acct_id
      WHERE c.acct_id IS NOT NULL 
      AND a.acct_id IS NULL
    `);
    
    console.log('Orphaned acct_ids in clients:', orphanedClients.rows);
    
    // Check for orphaned tax_sale_id in parcels
    const orphanedParcels = await pool.query(`
      SELECT DISTINCT p.tax_sale_id
      FROM parcels p
      LEFT JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
      WHERE p.tax_sale_id IS NOT NULL 
      AND ts.tax_sale_id IS NULL
    `);
    
    console.log('Orphaned tax_sale_ids in parcels:', orphanedParcels.rows);
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
