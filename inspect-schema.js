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
    // Get all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n=== TABLES ===');
    console.log(tables.rows.map(r => r.table_name).join(', '));
    
    // Get schema for each table
    for (const { table_name } of tables.rows) {
      console.log(`\n\n=== ${table_name.toUpperCase()} ===`);
      const cols = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table_name]);
      
      cols.rows.forEach(c => {
        const type = c.character_maximum_length 
          ? `${c.data_type}(${c.character_maximum_length})`
          : c.data_type;
        const nullable = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
        console.log(`  ${c.column_name}: ${type} ${nullable}${def}`);
      });
    }
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
