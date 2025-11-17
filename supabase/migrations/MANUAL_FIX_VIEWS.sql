-- =====================================================================
-- MANUAL FIX: Force Remove SECURITY DEFINER from Views
-- =====================================================================
-- Run this MANUALLY in Supabase Dashboard SQL Editor
-- =====================================================================

-- Step 1: Check current view options
SELECT
  schemaname,
  viewname,
  viewowner,
  pg_get_viewdef(schemaname || '.' || viewname, true) as definition
FROM pg_views
WHERE viewname IN ('admin_recent_activity', 'admin_top_creators')
  AND schemaname = 'public';

-- Step 2: Check if views have security_invoker option
SELECT
  c.relname as view_name,
  c.relkind as kind,
  pg_catalog.array_to_string(c.reloptions, ', ') as options
FROM pg_catalog.pg_class c
WHERE c.relname IN ('admin_recent_activity', 'admin_top_creators')
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Step 3: FORCE DROP CASCADE (removes all dependencies)
DROP VIEW IF EXISTS public.admin_recent_activity CASCADE;
DROP VIEW IF EXISTS public.admin_top_creators CASCADE;

-- Step 4: Recreate with EXPLICIT security_invoker=true
CREATE VIEW public.admin_recent_activity
WITH (security_invoker = true)  -- ✅ EXPLICITLY SET TO TRUE
AS
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
GRANT SELECT ON public.admin_recent_activity TO authenticated;

---

CREATE VIEW public.admin_top_creators
WITH (security_invoker = true)  -- ✅ EXPLICITLY SET TO TRUE
AS
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
GRANT SELECT ON public.admin_top_creators TO authenticated;

-- Step 5: Verify fix
SELECT
  c.relname as view_name,
  c.relkind as kind,
  pg_catalog.array_to_string(c.reloptions, ', ') as options
FROM pg_catalog.pg_class c
WHERE c.relname IN ('admin_recent_activity', 'admin_top_creators')
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Expected result: options should show 'security_invoker=true'
-- If still empty or 'security_invoker=false', Supabase has a bug!

-- =====================================================================
-- INSTRUCTIONS:
-- 1. Copy ALL of this SQL
-- 2. Go to Supabase Dashboard → SQL Editor
-- 3. Paste and run
-- 4. Check Step 5 results
-- 5. Re-run linter to verify fix
-- =====================================================================
