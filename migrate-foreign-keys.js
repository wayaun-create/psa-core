const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

(async () => {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'add_foreign_keys.sql'), 'utf8');
    
    console.log('Adding foreign key constraints...\n');
    await pool.query(sql);
    
    console.log('✅ Foreign keys added successfully:');
    console.log('   - clients.acct_id -> accounts.acct_id');
    console.log('   - tax_sales.client_id -> clients.client_id');
    console.log('   - parcels.tax_sale_id -> tax_sales.tax_sale_id');
    
    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
