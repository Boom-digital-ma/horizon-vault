-- ==========================================================
-- SQL PATCH FOR SUPABASE STORAGE RLS POLICIES
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ==========================================================

-- 1. Ensure storage.buckets has the 'studies' bucket (if not already created)
INSERT INTO storage.buckets (id, name, public)
VALUES ('studies', 'studies', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist to avoid conflict
DROP POLICY IF EXISTS "Admins can upload to studies bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read from studies bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update studies bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete from studies bucket" ON storage.objects;

-- 3. Create INSERT policy (Upload) for authenticated admins
CREATE POLICY "Admins can upload to studies bucket" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'studies' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 4. Create SELECT policy (Read/Preview) for authenticated admins
CREATE POLICY "Admins can read from studies bucket" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'studies' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 5. Create UPDATE policy for authenticated admins
CREATE POLICY "Admins can update studies bucket" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'studies' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- 6. Create DELETE policy for authenticated admins
CREATE POLICY "Admins can delete from studies bucket" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'studies' AND
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
