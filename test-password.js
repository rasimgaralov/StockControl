// Get users directly from DB
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: users } = await supabase.from('users').select('*').limit(1);
  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }
  const id = users[0].id;
  console.log(`Testing password update for user: ${id} (${users[0].username})`);
  
  try {
    const res = await fetch(`http://localhost:3000/api/users/${id}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'newpassword123' })
    });
    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.log('Error:', err.message);
  }
}
test();
