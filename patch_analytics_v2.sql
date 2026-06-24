-- 1. Add columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_time_on_site INTEGER DEFAULT 0 NOT NULL;

-- 2. Create trigger to sync last_sign_in_at from auth.users to profiles
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email,
        last_login_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- 3. Create RPC function to increment global site connection time
CREATE OR REPLACE FUNCTION public.increment_site_time(
    p_time_spent INTEGER
) RETURNS VOID SECURITY DEFINER AS $$
DECLARE
    c_user_id UUID;
BEGIN
    c_user_id := auth.uid();
    IF c_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    UPDATE public.profiles
    SET total_time_on_site = total_time_on_site + p_time_spent
    WHERE id = c_user_id;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.increment_site_time(INTEGER) TO authenticated;
