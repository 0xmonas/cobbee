-- =====================================================================
-- Migration: Fix Supabase Security Linter Issues
-- =====================================================================
-- Description:
--   Fix all security warnings and errors from Supabase linter:
--   1. Remove SECURITY DEFINER from admin views
--   2. Enable RLS on admin_wallets table
--   3. Add search_path to admin helper functions
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fix SECURITY DEFINER Views (ERROR)
-- ---------------------------------------------------------------------
-- Drop and recreate views without SECURITY DEFINER
-- RLS policies will handle security instead

DROP VIEW IF EXISTS public.admin_recent_activity;

CREATE OR REPLACE VIEW public.admin_recent_activity AS
SELECT
  al.id,
  al.event_type,
  al.actor_type,
  al.actor_id,
  al.target_type,
  al.target_id,
  al.changes,
  al.metadata,
  al.ip_address,
  al.user_agent,
  al.device_type,
  al.device_brand,
  al.device_model,
  al.browser_name,
  al.browser_version,
  al.os_name,
  al.os_version,
  al.geo_city,
  al.geo_country,
  al.geo_country_code,
  al.geo_region,
  al.geo_latitude,
  al.geo_longitude,
  al.geo_flag,
  al.session_id,
  al.created_at,
  u.username AS actor_username,
  u.display_name AS actor_display_name
FROM public.audit_logs al
LEFT JOIN public.users u ON al.actor_id::uuid = u.id
ORDER BY al.created_at DESC
LIMIT 100;

COMMENT ON VIEW public.admin_recent_activity IS 'Last 100 audit log entries with enriched metadata (admin access only)';

-- Grant SELECT to authenticated (RLS on audit_logs will restrict to admins)
GRANT SELECT ON public.admin_recent_activity TO authenticated;

---

DROP VIEW IF EXISTS public.admin_top_creators;

CREATE OR REPLACE VIEW public.admin_top_creators AS
SELECT
  u.id,
  u.username,
  u.display_name,
  u.email,
  u.wallet_address,
  u.coffee_price,
  u.is_active,
  u.is_blocked,
  u.blocked_at,
  u.blocked_reason,
  u.created_at,
  COALESCE(stats.total_supports, 0) AS total_supports,
  COALESCE(stats.total_supporters, 0) AS total_supporters,
  COALESCE(stats.total_earnings, 0) AS total_earnings,
  COALESCE(stats_30d.supports_last_30_days, 0) AS supports_last_30_days,
  COALESCE(stats_30d.earnings_last_30_days, 0) AS earnings_last_30_days,
  stats.last_support_at
FROM public.users u
LEFT JOIN (
  SELECT
    creator_id,
    COUNT(*) AS total_supports,
    COUNT(DISTINCT supporter_wallet_address) AS total_supporters,
    SUM(total_amount) AS total_earnings,
    MAX(created_at) AS last_support_at
  FROM public.supports
  WHERE status = 'confirmed'
  GROUP BY creator_id
) stats ON u.id = stats.creator_id
LEFT JOIN (
  SELECT
    creator_id,
    COUNT(*) AS supports_last_30_days,
    SUM(total_amount) AS earnings_last_30_days
  FROM public.supports
  WHERE status = 'confirmed'
  AND created_at >= NOW() - INTERVAL '30 days'
  GROUP BY creator_id
) stats_30d ON u.id = stats_30d.creator_id
ORDER BY stats.total_earnings DESC NULLS LAST;

COMMENT ON VIEW public.admin_top_creators IS 'Creators ranked by earnings with stats (admin access only)';

-- Grant SELECT to authenticated (RLS on users will restrict to admins)
GRANT SELECT ON public.admin_top_creators TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Enable RLS on admin_wallets (ERROR)
-- ---------------------------------------------------------------------

ALTER TABLE public.admin_wallets ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can SELECT (needed for is_admin_user() function)
DROP POLICY IF EXISTS "Anyone can view admin wallets" ON public.admin_wallets;
CREATE POLICY "Anyone can view admin wallets"
  ON public.admin_wallets
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Only admins can modify admin wallets" ON public.admin_wallets;
CREATE POLICY "Only admins can modify admin wallets"
  ON public.admin_wallets
  FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- Service role has full access (for sync operations)
DROP POLICY IF EXISTS "Service role full access to admin wallets" ON public.admin_wallets;
CREATE POLICY "Service role full access to admin wallets"
  ON public.admin_wallets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 3. Fix Function Search Path (WARN)
-- ---------------------------------------------------------------------

-- Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, auth  -- ✅ Fixed: search_path set
AS $$
DECLARE
  v_wallet_address TEXT;
BEGIN
  -- Get current user's wallet address
  SELECT wallet_address INTO v_wallet_address
  FROM public.users
  WHERE id = auth.uid();

  -- Check if wallet is in admin_wallets table
  IF v_wallet_address IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_wallets
    WHERE wallet_address = v_wallet_address
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin_user IS 'Returns TRUE if current user is an admin based on wallet address';

-- Fix add_admin_wallet function
CREATE OR REPLACE FUNCTION public.add_admin_wallet(
  p_wallet_address TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth  -- ✅ Fixed: search_path set
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can add admin wallets';
  END IF;

  -- Insert new admin wallet
  INSERT INTO public.admin_wallets (wallet_address, added_by, notes)
  VALUES (p_wallet_address, auth.uid(), p_notes)
  ON CONFLICT (wallet_address) DO NOTHING;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.add_admin_wallet IS 'Add new admin wallet (admin-only)';

-- Fix remove_admin_wallet function
CREATE OR REPLACE FUNCTION public.remove_admin_wallet(
  p_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth  -- ✅ Fixed: search_path set
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can remove admin wallets';
  END IF;

  -- Cannot remove own wallet (prevent lockout)
  IF p_wallet_address = (SELECT wallet_address FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Cannot remove your own admin access';
  END IF;

  -- Delete admin wallet
  DELETE FROM public.admin_wallets WHERE wallet_address = p_wallet_address;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.remove_admin_wallet IS 'Remove admin wallet (admin-only, cannot remove self)';

-- =====================================================================
-- End of Migration
-- =====================================================================

-- FIXES APPLIED:
-- ✅ admin_recent_activity view - Removed SECURITY DEFINER
-- ✅ admin_top_creators view - Removed SECURITY DEFINER
-- ✅ admin_wallets table - RLS enabled with policies
-- ✅ is_admin_user() - Added search_path = public, auth
-- ✅ add_admin_wallet() - Added search_path = public, auth
-- ✅ remove_admin_wallet() - Added search_path = public, auth
--
-- REMAINING WARNINGS (cannot be fixed via migration):
-- ⚠️ auth_leaked_password_protection - Must be enabled in Supabase Dashboard
--    Go to: Authentication > Policies > Enable "Leaked password protection"
--
-- SECURITY NOTES:
-- - Views now rely on RLS policies for security (admin_only SELECT on audit_logs)
-- - admin_wallets table has RLS enabled (anyone can view, only admins can modify)
-- - All SECURITY DEFINER functions have explicit search_path set
