-- Create RPC function to reset statistics for a specific investor
CREATE OR REPLACE FUNCTION public.reset_user_analytics(
    p_user_id UUID
) RETURNS VOID SECURITY DEFINER AS $$
BEGIN
    -- Check if the current user is an admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Reset profiles columns
    UPDATE public.profiles
    SET total_time_on_site = 0,
        last_login_at = NULL
    WHERE id = p_user_id;

    -- Delete study analytics
    DELETE FROM public.user_study_analytics
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.reset_user_analytics(UUID) TO authenticated;
