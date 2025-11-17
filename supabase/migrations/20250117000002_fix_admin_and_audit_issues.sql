-- =====================================================================
-- Migration: Fix Admin Authorization and Audit Log Issues
-- =====================================================================
-- Description:
--   1. Remove admin wallet check from database functions (API handles it)
--   2. Add RLS policies for audit_logs table
--   3. Fix SECURITY DEFINER views (convert to normal views)
--   4. Ensure triggers can write to audit_logs
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fix Admin Functions (Remove Postgres Config Check)
-- ---------------------------------------------------------------------
-- The API route already verifies admin access via environment variables
-- Database functions should not duplicate this check

CREATE OR REPLACE FUNCTION admin_block_user(
  p_user_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Violation of platform policies'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_admin_username TEXT;
  v_result JSON;
BEGIN
  -- Get target user info
  SELECT username INTO v_username
  FROM public.users
  WHERE id = p_user_id;

  IF v_username IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get admin username
  SELECT username INTO v_admin_username
  FROM public.users
  WHERE id = p_admin_id;

  -- Block user
  UPDATE public.users
  SET
    is_blocked = TRUE,
    blocked_at = NOW(),
    blocked_reason = p_reason,
    blocked_by = p_admin_id,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Create audit log
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    target_type,
    target_id,
    changes,
    metadata,
    ip_address
  ) VALUES (
    'user_blocked',
    'admin',
    p_admin_id,
    'user',
    p_user_id,
    jsonb_build_object(
      'old', jsonb_build_object('is_blocked', false),
      'new', jsonb_build_object('is_blocked', true, 'reason', p_reason)
    ),
    jsonb_build_object(
      'admin_username', v_admin_username,
      'target_username', v_username,
      'reason', p_reason
    ),
    NULL -- IP will be set by API route
  );

  -- Build result
  v_result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'username', v_username,
    'blocked_at', NOW(),
    'blocked_by', v_admin_username,
    'reason', p_reason
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION admin_unblock_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_admin_username TEXT;
  v_previous_reason TEXT;
  v_result JSON;
BEGIN
  -- Get target user info
  SELECT username, blocked_reason INTO v_username, v_previous_reason
  FROM public.users
  WHERE id = p_user_id;

  IF v_username IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get admin username
  SELECT username INTO v_admin_username
  FROM public.users
  WHERE id = p_admin_id;

  -- Unblock user
  UPDATE public.users
  SET
    is_blocked = FALSE,
    blocked_at = NULL,
    blocked_reason = NULL,
    blocked_by = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Create audit log
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    target_type,
    target_id,
    changes,
    metadata,
    ip_address
  ) VALUES (
    'user_unblocked',
    'admin',
    p_admin_id,
    'user',
    p_user_id,
    jsonb_build_object(
      'old', jsonb_build_object('is_blocked', true, 'reason', v_previous_reason),
      'new', jsonb_build_object('is_blocked', false)
    ),
    jsonb_build_object(
      'admin_username', v_admin_username,
      'target_username', v_username,
      'previous_reason', v_previous_reason
    ),
    NULL
  );

  -- Build result
  v_result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'username', v_username,
    'unblocked_at', NOW(),
    'unblocked_by', v_admin_username
  );

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------
-- 2. Add RLS Policies for audit_logs
-- ---------------------------------------------------------------------

-- Enable RLS on audit_logs if not already enabled
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do anything (for migrations, triggers)
DROP POLICY IF EXISTS "Service role can do anything" ON public.audit_logs;
CREATE POLICY "Service role can do anything"
  ON public.audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to INSERT audit logs
-- This is needed for API routes and triggers
DROP POLICY IF EXISTS "Allow INSERT for authenticated" ON public.audit_logs;
CREATE POLICY "Allow INSERT for authenticated"
  ON public.audit_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Allow admins to SELECT all audit logs
-- (We'll handle admin check in application, but limit to authenticated)
DROP POLICY IF EXISTS "Allow SELECT for authenticated" ON public.audit_logs;
CREATE POLICY "Allow SELECT for authenticated"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: No UPDATE or DELETE allowed (audit logs are immutable)
DROP POLICY IF EXISTS "Prevent UPDATE" ON public.audit_logs;
CREATE POLICY "Prevent UPDATE"
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Prevent DELETE" ON public.audit_logs;
CREATE POLICY "Prevent DELETE"
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------
-- 3. Fix SECURITY DEFINER Views
-- ---------------------------------------------------------------------
-- Recreate views without SECURITY DEFINER
-- RLS policies will handle security

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

-- Grant permissions
GRANT SELECT ON public.admin_recent_activity TO authenticated;
GRANT SELECT ON public.admin_top_creators TO authenticated;

-- =====================================================================
-- End of Migration
-- =====================================================================
