-- Create a trigger to copy new auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- We assume new users created via email/password will sync here
  -- the RAW_USER_META_DATA will contain role, name, deptId, etc.
  INSERT INTO public.users (id, name, email, role, "deptId", username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'), -- default role is 'user'
    NEW.raw_user_meta_data->>'deptId',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Drop the old login API route usage of simple password hash
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

-- Ensure users table uses uuid instead of TEXT if we want it to match exactly
-- But wait, public.users id is currently TEXT. NEW.id from auth.users is UUID.
-- Postgres can cast UUID to TEXT automatically for INSERT INTO users(id) TEXT.
-- So we don't strictly need to alter the column type if we rely on implicit cast.
-- However, for the Foreign Keys (deptId, etc) and the ID, keeping TEXT is fine.
