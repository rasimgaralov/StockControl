-- Add auth columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT UNIQUE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT,
  "details" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for activity_logs
ALTER TABLE "activity_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON "activity_logs" FOR ALL USING (true) WITH CHECK (true);
