-- ==========================================================
-- SQL PATCH FOR PDF VIEWER SUPPORT
-- Run this in your Supabase SQL Editor (https://supabase.com)
-- ==========================================================

-- 1. Add pdf_path column to public.studies
ALTER TABLE public.studies 
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- 2. Update the RPC function to return the pdf_path too (since we need it in metadata or in portal)
DROP FUNCTION IF EXISTS public.get_all_studies_metadata();

CREATE OR REPLACE FUNCTION public.get_all_studies_metadata()
RETURNS TABLE (
    id UUID,
    slug TEXT,
    title TEXT,
    category TEXT,
    intro_text TEXT,
    pdf_path TEXT
) SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        s.id, 
        s.slug, 
        s.title, 
        s.category, 
        c.intro_text,
        s.pdf_path
    FROM public.studies s
    LEFT JOIN public.categories c ON s.category = c.name
    ORDER BY c.order_index ASC, s.title ASC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_all_studies_metadata() TO authenticated;
