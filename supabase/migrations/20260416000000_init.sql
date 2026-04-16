-- Enable uuid-ossp extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure we are in public schema
SET search_path TO public;

-- Drop tables if they exist to start fresh during init (optional, but good for local/dev)
DROP TABLE IF EXISTS "stockAlerts" CASCADE;
DROP TABLE IF EXISTS "wasteLogs" CASCADE;
DROP TABLE IF EXISTS "transfers" CASCADE;
DROP TABLE IF EXISTS "deptStock" CASCADE;
DROP TABLE IF EXISTS "products" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "departments" CASCADE;

-- 1. Departments Table
CREATE TABLE "departments" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "icon" TEXT,
  "color" TEXT
);

-- 2. Users Table
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "role" TEXT NOT NULL,
  "deptId" TEXT REFERENCES "departments"("id") ON DELETE SET NULL
);

-- 3. Products Table
CREATE TABLE "products" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  "unit" TEXT NOT NULL,
  "supplier" TEXT,
  "expiryDate" TEXT,
  "criticalThreshold" INTEGER NOT NULL DEFAULT 0,
  "deptId" TEXT REFERENCES "departments"("id") ON DELETE SET NULL,
  "createdBy" TEXT REFERENCES "users"("id") ON DELETE SET NULL
);

-- 4. Department Stock Table (Many-to-Many products and departments)
CREATE TABLE "deptStock" (
  "productId" TEXT REFERENCES "products"("id") ON DELETE CASCADE,
  "deptId" TEXT REFERENCES "departments"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("productId", "deptId")
);

-- 5. Transfers Table
CREATE TABLE "transfers" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT REFERENCES "products"("id") ON DELETE CASCADE,
  "fromDeptId" TEXT REFERENCES "departments"("id") ON DELETE SET NULL,
  "toDeptId" TEXT REFERENCES "departments"("id") ON DELETE SET NULL,
  "quantity" INTEGER NOT NULL,
  "transferredBy" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "transferredAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Waste Logs Table
CREATE TABLE "wasteLogs" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT REFERENCES "products"("id") ON DELETE CASCADE,
  "deptId" TEXT REFERENCES "departments"("id") ON DELETE SET NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT,
  "loggedBy" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "loggedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Stock Alerts Table
CREATE TABLE "stockAlerts" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT REFERENCES "products"("id") ON DELETE CASCADE,
  "alertType" TEXT NOT NULL,
  "resolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "triggeredAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "resolvedAt" TIMESTAMP WITH TIME ZONE
);

/* RLS Policies - Allow all access for now (Anonymous allowed) */
ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deptStock" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wasteLogs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stockAlerts" ENABLE ROW LEVEL SECURITY;

-- Allow read/write to all for rapid API access (Emulating current mock store)
CREATE POLICY "Public Access" ON "departments" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "users" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "products" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "deptStock" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "transfers" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "wasteLogs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "stockAlerts" FOR ALL USING (true) WITH CHECK (true);
