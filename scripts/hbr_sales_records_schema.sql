-- Create hbr_sales_records table
CREATE TABLE IF NOT EXISTS "hbr_sales_records" (
  "id" SERIAL PRIMARY KEY,
  "sales_date" DATE NOT NULL,
  "server_name" TEXT NOT NULL,
  "item_name" TEXT NOT NULL,
  "family_group" TEXT,
  "category" TEXT NOT NULL, -- 'BEV', 'FOOD', 'SHISHA'
  "qty_sold" INTEGER NOT NULL,
  "net_sales" NUMERIC(10,3) NOT NULL,
  "cost_pct" NUMERIC(5,4) NOT NULL,
  "is_hp" INTEGER NOT NULL DEFAULT 0,
  "is_partial" BOOLEAN NOT NULL DEFAULT FALSE,
  "business_dates" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT "hbr_sales_records_unique_day_server_item" UNIQUE ("sales_date", "server_name", "item_name")
);

-- Enable RLS
ALTER TABLE "hbr_sales_records" ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public Access" ON "hbr_sales_records";

-- Public Access policies
CREATE POLICY "Public Access" ON "hbr_sales_records" FOR ALL USING (true) WITH CHECK (true);
