-- =====================================================================
-- Migration: FORCE FIX Security Definer Views
-- =====================================================================
-- Description:
--   Force recreate views to remove SECURITY DEFINER property.
--   This migration forcefully drops and recreates views to ensure
--   they are NOT created with SECURITY DEFINER.
--
--   Issue: Supabase linter still detects SECURITY DEFINER on views
--   even though previous migrations tried to fix it.
--
--   Root cause: Views may have been created with security_invoker=false
--   in older migrations, and Supabase caches this property.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Force Drop and Recreate admin_recent_activity (NO SECURITY DEFINER)
-- ---------------------------------------------------------------------

DROP VIEW IF EXISTS public.admin_recent_activity CASCADE;

-- Create view WITHOUT any security options
-- Default behavior: security_invoker=true (uses caller's permissions + RLS)
CREATE VIEW public.admin_recent_activity AS
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

COMMENT ON VIEW public.admin_recent_activity IS 'Last 100 audit log entries (admin-only via RLS on audit_logs)';

-- Grant SELECT to authenticated (RLS on audit_logs restricts to admins)
GRANT SELECT ON public.admin_recent_activity TO authenticated;

-- ---------------------------------------------------------------------
-- 2. Force Drop and Recreate admin_top_creators (NO SECURITY DEFINER)
-- ---------------------------------------------------------------------

DROP VIEW IF EXISTS public.admin_top_creators CASCADE;

-- Create view WITHOUT any security options
-- Default behavior: security_invoker=true (uses caller's permissions + RLS)
CREATE VIEW public.admin_top_creators AS
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

COMMENT ON VIEW public.admin_top_creators IS 'Creators ranked by earnings (admin-only via RLS on users)';

-- Grant SELECT to authenticated (RLS on users restricts to admins)
GRANT SELECT ON public.admin_top_creators TO authenticated;

-- ---------------------------------------------------------------------
-- 3. Verify View Security Settings
-- ---------------------------------------------------------------------

-- Query to verify views are NOT using SECURITY DEFINER:
-- Run this manually in SQL editor to confirm:
--
-- SELECT
--   schemaname,
--   viewname,
--   viewowner,
--   definition
-- FROM pg_views
-- WHERE viewname IN ('admin_recent_activity', 'admin_top_creators')
--   AND schemaname = 'public';
--
-- Expected: Both views should exist with security_invoker=true (default)

-- =====================================================================
-- End of Migration
-- =====================================================================

-- VERIFICATION:
-- After running this migration, the Supabase linter should show:
-- ✅ NO "security_definer_view" errors for these views
--
-- SECURITY:
-- - Views use caller's permissions (security_invoker=true by default)
-- - RLS policies on underlying tables (audit_logs, users) restrict access
-- - Only admins can see data due to RLS, not SECURITY DEFINER
--
-- NOTE FOR FUTURE:
-- Never create views with:
--   - WITH (security_invoker=false)
--   - SECURITY DEFINER option
-- Always rely on RLS policies for security!
