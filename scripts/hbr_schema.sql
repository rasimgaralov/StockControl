-- 1. Table: hbr_menu_costs
CREATE TABLE IF NOT EXISTS "hbr_menu_costs" (
  "id" SERIAL PRIMARY KEY,
  "item_name" TEXT NOT NULL,
  "cost_pct" NUMERIC(5,4) NOT NULL,
  "family_group" TEXT,
  "category" TEXT NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT "hbr_menu_costs_unique_item_cat" UNIQUE ("item_name", "category")
);

-- 2. Table: hbr_server_sales
CREATE TABLE IF NOT EXISTS "hbr_server_sales" (
  "id" SERIAL PRIMARY KEY,
  "server_name" TEXT NOT NULL,
  "item_name" TEXT NOT NULL,
  "family_group" TEXT,
  "category" TEXT NOT NULL,
  "qty_sold" INTEGER NOT NULL,
  "net_sales" NUMERIC(10,3) NOT NULL,
  "cost_pct" NUMERIC(5,4) NOT NULL,
  "is_hp" INTEGER NOT NULL DEFAULT 0,
  "is_partial" BOOLEAN NOT NULL DEFAULT FALSE,
  "business_dates" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table: hbr_monthly_sales
CREATE TABLE IF NOT EXISTS "hbr_monthly_sales" (
  "id" SERIAL PRIMARY KEY,
  "month_label" TEXT NOT NULL,
  "item_name" TEXT NOT NULL,
  "family_group" TEXT,
  "category" TEXT NOT NULL,
  "qty_sold" INTEGER NOT NULL,
  "net_sales" NUMERIC(10,3) NOT NULL,
  "cost_pct" NUMERIC(5,4) NOT NULL,
  "is_hp" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "hbr_menu_costs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hbr_server_sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "hbr_monthly_sales" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON "hbr_menu_costs";
DROP POLICY IF EXISTS "Public Access" ON "hbr_server_sales";
DROP POLICY IF EXISTS "Public Access" ON "hbr_monthly_sales";

-- Public Access policies
CREATE POLICY "Public Access" ON "hbr_menu_costs" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "hbr_server_sales" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Access" ON "hbr_monthly_sales" FOR ALL USING (true) WITH CHECK (true);
