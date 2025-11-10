-- ============================================================================
-- FIX LINTER ERRORS & WARNINGS
-- ============================================================================

-- 1. Drop existing views
DROP VIEW IF EXISTS public_creator_profiles;
DROP VIEW IF EXISTS creator_dashboard_stats;

-- 2. Recreate views with SECURITY INVOKER
CREATE VIEW public_creator_profiles 
WITH (security_invoker=on)
AS
SELECT
  id, wallet_address, username, display_name, bio, avatar_url, cover_image_url,
  twitter_handle, instagram_handle, github_handle, tiktok_handle, opensea_handle,
  coffee_price, created_at
FROM public.users
WHERE is_active = true;

CREATE VIEW creator_dashboard_stats 
WITH (security_invoker=on)
AS
SELECT
  u.id, u.username, u.display_name,
  COUNT(s.id) FILTER (WHERE s.status = 'confirmed') as total_supports,
  COUNT(DISTINCT s.supporter_wallet_address) FILTER (WHERE s.status = 'confirmed') as total_supporters,
  COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'confirmed'), 0) as total_earnings,
  COUNT(s.id) FILTER (WHERE s.status = 'confirmed' AND s.created_at >= DATE_TRUNC('month', NOW())) as monthly_supports,
  COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'confirmed' AND s.created_at >= DATE_TRUNC('month', NOW())), 0) as monthly_earnings
FROM public.users u
LEFT JOIN public.supports s ON u.id = s.creator_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.display_name;

-- 3. Fix functions - add search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_wallet_blacklisted(p_wallet_address TEXT)
RETURNS BOOLEAN SET search_path = public AS $$
DECLARE
  v_is_blacklisted BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.blacklisted_wallets
    WHERE wallet_address = p_wallet_address
  ) INTO v_is_blacklisted;
  RETURN v_is_blacklisted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;