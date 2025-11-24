-- Rename users table to profiles
-- This migration renames the existing users table to profiles to avoid confusion with auth.users

-- First, check if the users table exists and rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'users'
  ) THEN
    -- Rename the table
    ALTER TABLE public.users RENAME TO profiles;

    -- Note: Constraints, indexes, and triggers automatically get renamed with _old suffix
    -- We don't need to manually update RLS policies as they reference the table by OID, not name

  ELSIF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
  ) THEN
    -- If neither users nor profiles exists, something went wrong
    RAISE EXCEPTION 'Neither users nor profiles table exists';
  END IF;
  -- If profiles already exists, we're good (migration already ran)
END $$;
