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
    const sqlPath = path.join(__dirname, 'hbr_schema.sql');
    console.log(`Reading schema from ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing schema queries...');
    await client.query(sql);
    console.log('Successfully created HBR tables and configured RLS Policies!');
    
    // Verify existing tables are untouched
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\nVerified tables in database:');
    tablesRes.rows.forEach(r => {
      console.log(` - ${r.table_name}`);
    });
    
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await client.end();
  }
}

run();
