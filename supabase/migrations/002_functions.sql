-- ============================================================
-- OmniLaunch — Database Functions
-- ============================================================

-- Decrement launches remaining for a user
CREATE OR REPLACE FUNCTION public.decrement_launches(user_id_input UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET launches_remaining = GREATEST(launches_remaining - 1, 0),
        updated_at = now()
    WHERE id = user_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset monthly launches (called by cron or webhook)
CREATE OR REPLACE FUNCTION public.reset_monthly_launches()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles p
    SET launches_remaining = COALESCE(
        (SELECT s.launches_per_month FROM public.subscriptions s WHERE s.user_id = p.id AND s.status = 'active' LIMIT 1),
        3
    ),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
