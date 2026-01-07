const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : undefined,
});

// Map CSV column names to database column names (snake_case)
const columnMapping = {
  'TAX SALE ID': 'tax_sale_id',
  'PARCEL ID': 'parcel_id',
  'FILE #': 'file_number',
  'REMOVE': 'remove',
  'NOTES': 'notes',
  'YEARS DUE': 'years_due',
  'MAP/PARCEL': 'map_parcel',
  'BILL': 'bill',
  'ACCOUNT': 'account',
  'PROPERTY DESCRIPTION': 'property_description',
  'DEF IN FIFA': 'def_in_fifa',
  'DEF': 'def',
  'DEF ADD : Street 1': 'def_add_street_1',
  'DEF ADD : Street 2': 'def_add_street_2',
  'DEF ADD : City': 'def_add_city',
  'DEF ADD : State': 'def_add_state',
  'DEF ADD : Zip': 'def_add_zip',
  'DN ADD : Street 1': 'dn_add_street_1',
  'DN ADD : Street 2': 'dn_add_street_2',
  'DN ADD : City': 'dn_add_city',
  'DN ADD : State': 'dn_add_state',
  'DN ADD : Zip': 'dn_add_zip',
  'CRH': 'crh',
  'CRH ADD : Street 1': 'crh_add_street_1',
  'CRH ADD : Street 2': 'crh_add_street_2',
  'CRH ADD : City': 'crh_add_city',
  'CRH ADD : State': 'crh_add_state',
  'CRH ADD : Zip': 'crh_add_zip',
  'OCC ADD : Street 1': 'occ_add_street_1',
  'OCC ADD : Street 2': 'occ_add_street_2',
  'OCC ADD : City': 'occ_add_city',
  'OCC ADD : State': 'occ_add_state',
  'OCC ADD : Zip': 'occ_add_zip',
  'LH1': 'lh1',
  'LH1 ADD : Street 1': 'lh1_add_street_1',
  'LH1 ADD : Street 2': 'lh1_add_street_2',
  'LH1 ADD : City': 'lh1_add_city',
  'LH1 ADD : State': 'lh1_add_state',
  'LH1 ADD : Zip': 'lh1_add_zip',
  'LH1 REF DEED': 'lh1_ref_deed',
  'LH1 DEED INFO': 'lh1_deed_info',
  'LH2': 'lh2',
  'LH2 ADD : Street 1': 'lh2_add_street_1',
  'LH2 ADD : Street 2': 'lh2_add_street_2',
  'LH2 ADD : City': 'lh2_add_city',
  'LH2 ADD : State': 'lh2_add_state',
  'LH2 ADD : Zip': 'lh2_add_zip',
  'LH2 REF DEED': 'lh2_ref_deed',
  'LH2 DEED INFO': 'lh2_deed_info',
  'LH3': 'lh3',
  'LH3 ADD : Street 1': 'lh3_add_street_1',
  'LH3 ADD : Street 2': 'lh3_add_street_2',
  'LH3 ADD : City': 'lh3_add_city',
  'LH3 ADD : State': 'lh3_add_state',
  'LH3 ADD : Zip': 'lh3_add_zip',
  'LH3 REF DEED': 'lh3_ref_deed',
  'LH3 DEED INFO': 'lh3_deed_info',
  '(RA) REGISTERED AGENT': 'ra_registered_agent',
  '(RA) REGISTERED AGENT : Title': 'ra_registered_agent_title',
  '(RA) REGISTERED AGENT : First': 'ra_registered_agent_first',
  '(RA) REGISTERED AGENT : Middle': 'ra_registered_agent_middle',
  '(RA) REGISTERED AGENT : Last': 'ra_registered_agent_last',
  'RA ADDRESS : Street 1': 'ra_address_street_1',
  'RA ADDRESS : Street 2': 'ra_address_street_2',
  'RA ADDRESS : City': 'ra_address_city',
  'RA ADDRESS : State': 'ra_address_state',
  'RA ADDRESS : Zip': 'ra_address_zip',
  'RA PHONE': 'ra_phone',
  'M1': 'm1',
  'M1 ADD : Street 1': 'm1_add_street_1',
  'M1 ADD : Street 2': 'm1_add_street_2',
  'M1 ADD : City': 'm1_add_city',
  'M1 ADD : State': 'm1_add_state',
  'M1 ADD : Zip': 'm1_add_zip',
  'M1 INFO': 'm1_info',
  'M2': 'm2',
  'M2 ADD : Street 1': 'm2_add_street_1',
  'M2 ADD : Street 2': 'm2_add_street_2',
  'M2 ADD : City': 'm2_add_city',
  'M2 ADD : State': 'm2_add_state',
  'M2 ADD : Zip': 'm2_add_zip',
  'M2 INFO': 'm2_info',
  'M3': 'm3',
  'M3 ADD : Street 1': 'm3_add_street_1',
  'M3 ADD : Street 2': 'm3_add_street_2',
  'M3 ADD : City': 'm3_add_city',
  'M3 ADD : State': 'm3_add_state',
  'M3 ADD : Zip': 'm3_add_zip',
  'M3 INFO': 'm3_info',
  'FTL': 'ftl',
  'FTL BOOK/PAGE': 'ftl_book_page',
  'GTL': 'gtl',
  'GTL BOOK/PAGE': 'gtl_book_page',
  'DOL': 'dol',
  'DOL BOOK/PAGE': 'dol_book_page',
  'CITY': 'city',
  'CITY BOOK/PAGE': 'city_book_page',
  'LEGAL': 'legal',
  'REF DEED': 'ref_deed'
};

async function loadData() {
  const client = await pool.connect();
  const csvPath = path.join(__dirname, 'data', 'conyers_may_2025_sample_56.csv');
  const rows = [];
  
  console.log('📖 Reading CSV file...\n');
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        // Map CSV columns to DB columns
        const mappedRow = {};
        for (const [csvCol, dbCol] of Object.entries(columnMapping)) {
          // Handle empty strings as NULL
          mappedRow[dbCol] = row[csvCol] && row[csvCol].trim() !== '' ? row[csvCol].trim() : null;
        }
        rows.push(mappedRow);
      })
      .on('end', async () => {
        try {
          console.log(`✅ Read ${rows.length} rows from CSV\n`);
          console.log('💾 Inserting data into database...\n');
          
          // Start transaction
          await client.query('BEGIN');
          
          let successCount = 0;
          let errorCount = 0;
          
          for (const row of rows) {
            try {
              const columns = Object.keys(row);
              const values = Object.values(row);
              const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
              
              const query = `
                INSERT INTO core.parcels_test (${columns.join(', ')})
                VALUES (${placeholders})
              `;
              
              await client.query(query, values);
              successCount++;
              
              if (successCount % 10 === 0) {
                console.log(`   Inserted ${successCount} rows...`);
              }
            } catch (err) {
              errorCount++;
              console.error(`   ❌ Error inserting row: ${err.message}`);
            }
          }
          
          // Commit transaction
          await client.query('COMMIT');
          
          console.log('\n✅ Data loading complete:');
          console.log(`   - Successfully inserted: ${successCount} rows`);
          console.log(`   - Errors: ${errorCount} rows`);
          console.log(`   - Table: core.parcels_test`);
          
          resolve();
        } catch (err) {
          await client.query('ROLLBACK');
          reject(err);
        } finally {
          client.release();
        }
      })
      .on('error', reject);
  });
}

(async () => {
  try {
    await loadData();
    await pool.end();
  } catch (e) {
    console.error('❌ Fatal error:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
