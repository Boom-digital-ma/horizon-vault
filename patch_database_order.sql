-- ==========================================================
-- SQL PATCH TO ADD ORDER_INDEX TO STUDIES & SORT BY IT
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ==========================================================

-- 1. Add order_index column to studies table
ALTER TABLE public.studies
ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill order_index for existing studies based on standard slugs
UPDATE public.studies SET order_index = 1 WHERE slug = 'exec-summary';
UPDATE public.studies SET order_index = 2 WHERE slug = 'financiere';
UPDATE public.studies SET order_index = 3 WHERE slug = 'benchmark';
UPDATE public.studies SET order_index = 4 WHERE slug = 'marketing';
UPDATE public.studies SET order_index = 5 WHERE slug = 'fiscale';
UPDATE public.studies SET order_index = 6 WHERE slug = 'tresorerie';
UPDATE public.studies SET order_index = 7 WHERE slug = 'gouvernance';

-- 3. Drop and recreate get_all_studies_metadata() to return order_index and sort by it
DROP FUNCTION IF EXISTS public.get_all_studies_metadata();

CREATE OR REPLACE FUNCTION public.get_all_studies_metadata()
RETURNS TABLE (
    id UUID,
    slug TEXT,
    title TEXT,
    category TEXT,
    intro_text TEXT,
    pdf_path TEXT,
    order_index INTEGER
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        s.id, 
        s.slug, 
        s.title, 
        s.category, 
        c.intro_text,
        s.pdf_path,
        s.order_index
    FROM public.studies s
    LEFT JOIN public.categories c ON s.category = c.name
    ORDER BY c.order_index ASC, COALESCE(s.order_index, 0) ASC, s.title ASC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_all_studies_metadata() TO authenticated;
