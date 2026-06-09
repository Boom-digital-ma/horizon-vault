-- ==========================================================
-- SQL PATCH FOR REALTIME ACCESS & STATUS UPDATES
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ==========================================================

-- 1. Add 'is_active' column to profiles if it does not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Add profiles and user_study_access to realtime publication safely
DO $$
BEGIN
  -- Add profiles table to publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  -- Add user_study_access table to publication if not already present
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_class c ON pr.prrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_publication p ON pr.prpubid = p.oid
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'user_study_access'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_study_access;
  END IF;
END $$;

-- 3. Set REPLICA IDENTITY FULL to include all columns in DELETE/UPDATE payloads
ALTER TABLE public.user_study_access REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
