-- Create inbounds table to track newly incoming stocks
CREATE TABLE IF NOT EXISTS "inbounds" (
  "id" TEXT PRIMARY KEY,
  "productId" TEXT REFERENCES "products"("id") ON DELETE CASCADE,
  "quantity" INTEGER NOT NULL,
  "supplier" TEXT,
  "receivedBy" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "receivedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for inbounds
ALTER TABLE "inbounds" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "inbounds" FOR ALL USING (true) WITH CHECK (true);
