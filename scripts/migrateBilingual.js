const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/Users/ruslangaralov/Desktop/Projects/saas/StockControl/.env.local' });

const maps = {
  units: {
    'kg': '{"en":"kg","ar":"كجم"}',
    'adet': '{"en":"pcs","ar":"قطع"}',
    'litre': '{"en":"liters","ar":"لتر"}',
    'paket': '{"en":"pack","ar":"عبوة"}'
  },
  departments: {
    'Mutfak': '{"en":"Kitchen","ar":"المطبخ"}',
    'Bar': '{"en":"Bar","ar":"البار"}',
    'Nargile': '{"en":"Shisha","ar":"الشيشة"}',
    'Operasyon': '{"en":"Operations","ar":"العمليات"}',
    'Depo': '{"en":"Warehouse","ar":"المستودع"}',
    'Ana Depo': '{"en":"Main Warehouse","ar":"المستودع الرئيسي"}'
  },
  suppliers: {
    'İçki & Meşrubat': '{"en":"Drinks & Beverages","ar":"مشروبات ومرطبات"}',
    'Yerel Satınalma': '{"en":"Local Purchasing","ar":"مشتريات محلية"}',
    'Temizlik & Operasyon': '{"en":"Cleaning & Operations","ar":"تنظيف وعمليات"}',
    'Nargile Tedarik': '{"en":"Shisha Supply","ar":"توريد الشيشة"}',
    'Ana Depo': '{"en":"Main Warehouse","ar":"المستودع الرئيسي"}'
  },
  reasons: {
    'Son kullanma tarihi gecmis': '{"en":"Expired","ar":"منتهي الصلاحية"}',
    'Dusuruldu/Kirildi': '{"en":"Dropped / Broken","ar":"سقط / مكسور"}',
    'Zarar görmüş': '{"en":"Damaged","ar":"تالف"}',
    'Bozuk urun': '{"en":"Spoiled Product","ar":"منتج فاسد"}',
    'Kayıp': '{"en":"Lost","ar":"مفقود"}'
  },
  roles: {
    'admin': '{"en":"Admin","ar":"مدير"}',
    'depo_sorumlusu': '{"en":"Warehouse Keeper","ar":"أمين المستودع"}',
    'dept_sefi': '{"en":"Department Chief","ar":"رئيس القسم"}'
  }
};

const mockPath = path.join(__dirname, '../data/mockData.js');
let mockContent = fs.readFileSync(mockPath, 'utf-8');

// Replace standard unit / supplier / role declarations in mockData.js using regexes to ensure match exact values
Object.entries(maps.units).forEach(([k, v]) => { mockContent = mockContent.replace(new RegExp(`unit: '${k}'`, 'g'), `unit: '${v}'`); });
Object.entries(maps.departments).forEach(([k, v]) => { mockContent = mockContent.replace(new RegExp(`name: '${k}'`, 'g'), `name: '${v}'`); });
Object.entries(maps.suppliers).forEach(([k, v]) => { mockContent = mockContent.replace(new RegExp(`supplier: '${k}'`, 'g'), `supplier: '${v}'`); });
Object.entries(maps.reasons).forEach(([k, v]) => { mockContent = mockContent.replace(new RegExp(`reason: '${k}'`, 'g'), `reason: '${v}'`); });
Object.entries(maps.roles).forEach(([k, v]) => { mockContent = mockContent.replace(new RegExp(`role: '${k}'`, 'g'), `role: '${v}'`); });

fs.writeFileSync(mockPath, mockContent, 'utf-8');
console.log("✅ mockData.js updated with bilingual strings.");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runDatabaseMigration() {
  console.log("Migrating departments...");
  const { data: depts } = await supabase.from('departments').select('*');
  for (const d of (depts||[])) {
    if (maps.departments[d.name]) {
      await supabase.from('departments').update({ name: maps.departments[d.name] }).eq('id', d.id);
    }
  }

  console.log("Migrating users...");
  const { data: usrs } = await supabase.from('users').select('*');
  for (const u of (usrs||[])) {
    if (maps.roles[u.role]) {
      // roles could also be mapped
      await supabase.from('users').update({ role: maps.roles[u.role] }).eq('id', u.id);
    }
  }

  console.log("Migrating wasteLogs...");
  const { data: wastes } = await supabase.from('wasteLogs').select('*');
  for (const w of (wastes||[])) {
    if (maps.reasons[w.reason]) {
      await supabase.from('wasteLogs').update({ reason: maps.reasons[w.reason] }).eq('id', w.id);
    }
  }

  console.log("Migrating products...");
  const { data: prods } = await supabase.from('products').select('*');
  const updatePromises = (prods||[]).map(async p => {
    let changed = false;
    let updates = {};
    if (maps.units[p.unit]) { updates.unit = maps.units[p.unit]; changed = true; }
    if (maps.suppliers[p.supplier]) { updates.supplier = maps.suppliers[p.supplier]; changed = true; }
    
    if (changed) {
      await supabase.from('products').update(updates).eq('id', p.id);
    }
  });

  await Promise.all(updatePromises);
  console.log(`✅ Supabase database completely mapped to Bilingual JSON fields.`);
}
runDatabaseMigration();
