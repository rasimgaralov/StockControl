const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'db.qbqqfdnzoeprhltyefeu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '.3?hh9t9jRk&WH-'
});

async function run() {
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  
  try {
    const sqlPath = path.join(__dirname, 'hbr_sales_records_schema.sql');
    console.log(`Reading schema from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing schema queries...');
    await client.query(sql);
    console.log('Successfully created hbr_sales_records table and configured RLS Policies!');
    
    // Verify table exists
    const checkRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hbr_sales_records'
      );
    `);
    
    console.log('Verification: hbr_sales_records exists:', checkRes.rows[0].exists);
    
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await client.end();
  }
}

run();
