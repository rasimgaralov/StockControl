const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read sql file  
  const sql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20260417000000_auth_and_logs.sql'),
    'utf8'
  );

  // Try using the Supabase REST endpoint to exec SQL
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({})
  });
  
  console.log('Supabase does not support raw SQL via REST API.');
  console.log('');
  console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:');
  console.log('Go to: https://supabase.com/dashboard → SQL Editor');
  console.log('');
  console.log('='.repeat(60));
  console.log(sql);
  console.log('='.repeat(60));
  console.log('');
  console.log('After running the SQL above, run: node scripts/seedUsers.js');
}

run().catch(console.error);
