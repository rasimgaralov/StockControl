const { Client } = require('pg');

const client = new Client({
  host: 'db.qbqqfdnzoeprhltyefeu.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '.3?hh9t9jRk&WH-'
});

async function migrate() {
  await client.connect();
  const queries = [
    `ALTER TABLE "products" ALTER COLUMN "quantity" TYPE NUMERIC(10,3);`,
    `ALTER TABLE "products" ALTER COLUMN "criticalThreshold" TYPE NUMERIC(10,3);`,
    `ALTER TABLE "transfers" ALTER COLUMN "quantity" TYPE NUMERIC(10,3);`,
    `ALTER TABLE "wasteLogs" ALTER COLUMN "quantity" TYPE NUMERIC(10,3);`,
    `ALTER TABLE "deptStock" ALTER COLUMN "quantity" TYPE NUMERIC(10,3);`,
    `ALTER TABLE "inbounds" ALTER COLUMN "quantity" TYPE NUMERIC(10,3);`
  ];
  for (let q of queries) {
    try {
      await client.query(q);
      console.log('Success:', q);
    } catch (e) {
      console.error('Error on:', q, e.message);
    }
  }
  await client.end();
}
migrate();
