import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', '123211cb-1adf-4d08-8b5f-02f94ee22a58')
    .single();

  console.log('Data:', data);
  console.log('Error:', error);
}

test();
