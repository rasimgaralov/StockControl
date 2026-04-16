const { Client } = require('pg');
require('dotenv').config({ path: '/Users/ruslangaralov/Desktop/Projects/saas/StockControl/.env.local' });

async function run() {
  const client = new Client({
    user: 'postgres',
    password: '.3?hh9t9jRk&WH-',
    host: 'db.qbqqfdnzoeprhltyefeu.supabase.co',
    port: 5432,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  try {
    console.log("Altering 'departments' table...");
    await client.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "name_en" text;`);
    await client.query(`ALTER TABLE "departments" ADD COLUMN IF NOT EXISTS "name_ar" text;`);
    
    const resDepts = await client.query(`SELECT id, name FROM "departments" WHERE name LIKE '{%'`);
    for(let row of resDepts.rows) {
      try {
        const obj = JSON.parse(row.name);
        await client.query(`UPDATE "departments" SET name_en = $1, name_ar = $2 WHERE id = $3`, [obj.en, obj.ar, row.id]);
      } catch (e) {}
    }

    console.log("Altering 'users' table...");
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_en" text;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_ar" text;`);
    const resUsers = await client.query(`SELECT id, role FROM "users" WHERE role LIKE '{%'`);
    for(let row of resUsers.rows) {
      try {
        const obj = JSON.parse(row.role);
        await client.query(`UPDATE "users" SET role_en = $1, role_ar = $2 WHERE id = $3`, [obj.en, obj.ar, row.id]);
      } catch (e) {}
    }

    console.log("Altering 'products' table...");
    await client.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier_en" text;`);
    await client.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier_ar" text;`);
    await client.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit_en" text;`);
    await client.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "unit_ar" text;`);
    const resProducts = await client.query(`SELECT id, supplier, unit FROM "products"`);
    for(let row of resProducts.rows) {
      let sEn=null, sAr=null, uEn=null, uAr=null;
      let doSupplier = false, doUnit = false;

      if (row.supplier && typeof row.supplier === 'string' && row.supplier.startsWith('{')) {
        try { const obj = JSON.parse(row.supplier); sEn = obj.en; sAr = obj.ar; doSupplier = true; } catch(e){}
      }
      if (row.unit && typeof row.unit === 'string' && row.unit.startsWith('{')) {
        try { const obj = JSON.parse(row.unit); uEn = obj.en; uAr = obj.ar; doUnit = true; } catch(e){}
      }
      
      let setQ = [];
      let vals = [];
      let idx = 1;
      if (doSupplier) { setQ.push(`supplier_en=$${idx++}`, `supplier_ar=$${idx++}`); vals.push(sEn, sAr); }
      if (doUnit) { setQ.push(`unit_en=$${idx++}`, `unit_ar=$${idx++}`); vals.push(uEn, uAr); }
      
      if (setQ.length > 0) {
        vals.push(row.id);
        await client.query(`UPDATE "products" SET ${setQ.join(', ')} WHERE id=$${idx}`, vals);
      }
    }

    console.log("Altering 'wasteLogs' table...");
    await client.query(`ALTER TABLE "wasteLogs" ADD COLUMN IF NOT EXISTS "reason_en" text;`);
    await client.query(`ALTER TABLE "wasteLogs" ADD COLUMN IF NOT EXISTS "reason_ar" text;`);
    const resWaste = await client.query(`SELECT id, reason FROM "wasteLogs" WHERE reason LIKE '{%'`);
    for(let row of resWaste.rows) {
      try {
        const obj = JSON.parse(row.reason);
        await client.query(`UPDATE "wasteLogs" SET reason_en = $1, reason_ar = $2 WHERE id = $3`, [obj.en, obj.ar, row.id]);
      } catch (e) {}
    }

    console.log("✅ Schema altered and data migrated successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}
run();
