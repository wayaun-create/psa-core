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
    const sql = fs.readFileSync(path.join(__dirname, 'sql', 'create_core_parcels_test.sql'), 'utf8');
    
    console.log('Creating core.parcels_test table...\n');
    await pool.query(sql);
    
    console.log('✅ Table created successfully:');
    console.log('   - Schema: core');
    console.log('   - Table: parcels_test');
    console.log('   - Columns: 96 TEXT columns + id (SERIAL) + timestamps');
    console.log('   - Indexes: tax_sale_id, parcel_id');
    
    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
