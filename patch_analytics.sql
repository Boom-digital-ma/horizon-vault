-- Add atomic increment function for study analytics
CREATE OR REPLACE FUNCTION public.increment_study_analytics(
    p_study_id UUID,
    p_clicks INTEGER,
    p_time_spent INTEGER
) RETURNS VOID SECURITY DEFINER AS $$
DECLARE
    c_user_id UUID;
BEGIN
    c_user_id := auth.uid();
    IF c_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    INSERT INTO public.user_study_analytics (user_id, study_id, clicks, time_spent, updated_at)
    VALUES (c_user_id, p_study_id, p_clicks, p_time_spent, now())
    ON CONFLICT (user_id, study_id) DO UPDATE SET
        clicks = user_study_analytics.clicks + EXCLUDED.clicks,
        time_spent = user_study_analytics.time_spent + EXCLUDED.time_spent,
        updated_at = now();
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.increment_study_analytics(UUID, INTEGER, INTEGER) TO authenticated;
