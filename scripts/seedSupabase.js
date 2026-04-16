const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Initialized Supabase Client');

  try {
    const mockDataFile = path.join(__dirname, '../data/mockData.js');
    const { departments, users, products, transfers, wasteLogs, stockAlerts, deptStock } = await import('file://' + mockDataFile);
    
    console.log(`📦 Loaded ${products.length} products, ${departments.length} departments from mockData`);

    const insertData = async (tableName, data) => {
      if (!data || data.length === 0) return;
      
      // Supabase REST bulk insert
      const { error } = await supabase.from(tableName).upsert(data, { ignoreDuplicates: true });
      if (error) {
        console.error(`Error inserting into ${tableName}:`, error.message);
      } else {
        console.log(`✅ Inserted/Upserted ${data.length} records into "${tableName}"`);
      }
    };

    await insertData('departments', departments);
    await insertData('users', users);
    await insertData('products', products);
    await insertData('deptStock', deptStock);
    await insertData('transfers', transfers);
    await insertData('wasteLogs', wasteLogs);
    
    if (stockAlerts && stockAlerts.length > 0) {
      await insertData('stockAlerts', stockAlerts);
    }

    console.log('🚀 Seeding completed successfully!');
    
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  }
}

run();
