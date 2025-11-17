-- =====================================================================
-- Migration: Add User Blocking & Enhanced Audit Logs
-- =====================================================================
-- Description:
--   1. Add user blocking columns to users table
--   2. Enhance audit_logs table with geolocation, user agent, device info
--   3. Add indexes for performance
--   4. Create admin functions for user moderation
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Add User Blocking Columns to Users Table
-- ---------------------------------------------------------------------

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for blocked users (for middleware performance)
CREATE INDEX IF NOT EXISTS idx_users_is_blocked
ON public.users(is_blocked) WHERE is_blocked = TRUE;

-- Create index for blocked_by (admin queries)
CREATE INDEX IF NOT EXISTS idx_users_blocked_by
ON public.users(blocked_by) WHERE blocked_by IS NOT NULL;

COMMENT ON COLUMN public.users.is_blocked IS 'Whether user account is blocked/banned by admin';
COMMENT ON COLUMN public.users.blocked_at IS 'Timestamp when user was blocked';
COMMENT ON COLUMN public.users.blocked_reason IS 'Reason for blocking (shown to user)';
COMMENT ON COLUMN public.users.blocked_by IS 'Admin user ID who performed the block';

-- ---------------------------------------------------------------------
-- 2. Enhance Audit Logs Table with Geolocation & Device Info
-- ---------------------------------------------------------------------

ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS device_brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS device_model VARCHAR(100),
ADD COLUMN IF NOT EXISTS browser_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS browser_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS os_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS os_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS geo_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS geo_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS geo_country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS geo_region VARCHAR(100),
ADD COLUMN IF NOT EXISTS geo_latitude DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS geo_longitude DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS geo_flag VARCHAR(10),
ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);

-- Create indexes for common audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id
ON public.audit_logs(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_geo_country
ON public.audit_logs(geo_country) WHERE geo_country IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_device_type
ON public.audit_logs(device_type) WHERE device_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_desc
ON public.audit_logs(created_at DESC);

COMMENT ON COLUMN public.audit_logs.user_agent IS 'Full User-Agent header string';
COMMENT ON COLUMN public.audit_logs.device_type IS 'Device type: mobile, tablet, desktop, console, wearable, embedded';
COMMENT ON COLUMN public.audit_logs.device_brand IS 'Device manufacturer: Apple, Samsung, Google, etc.';
COMMENT ON COLUMN public.audit_logs.device_model IS 'Device model: iPhone, Galaxy S21, etc.';
COMMENT ON COLUMN public.audit_logs.browser_name IS 'Browser name: Chrome, Safari, Firefox, etc.';
COMMENT ON COLUMN public.audit_logs.browser_version IS 'Browser version number';
COMMENT ON COLUMN public.audit_logs.os_name IS 'Operating system: iOS, Android, Windows, macOS, Linux';
COMMENT ON COLUMN public.audit_logs.os_version IS 'OS version number';
COMMENT ON COLUMN public.audit_logs.geo_city IS 'City detected from IP (Vercel geolocation)';
COMMENT ON COLUMN public.audit_logs.geo_country IS 'Country detected from IP';
COMMENT ON COLUMN public.audit_logs.geo_country_code IS 'ISO country code (e.g., US, TR, GB)';
COMMENT ON COLUMN public.audit_logs.geo_region IS 'Vercel edge region that handled request';
COMMENT ON COLUMN public.audit_logs.geo_latitude IS 'Approximate latitude';
COMMENT ON COLUMN public.audit_logs.geo_longitude IS 'Approximate longitude';
COMMENT ON COLUMN public.audit_logs.geo_flag IS 'Country flag emoji';
COMMENT ON COLUMN public.audit_logs.session_id IS 'User session identifier for tracking multi-request flows';

-- ---------------------------------------------------------------------
-- 3. Create Admin Function: Block User
-- ---------------------------------------------------------------------

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
  -- Verify admin has permission (RLS handles this, but extra check)
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_admin_id
    AND wallet_address = ANY(
      string_to_array(current_setting('app.admin_wallet_addresses', true), ',')
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

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

COMMENT ON FUNCTION admin_block_user IS 'Admin function to block/ban a user account';

-- ---------------------------------------------------------------------
-- 4. Create Admin Function: Unblock User
-- ---------------------------------------------------------------------

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
  -- Verify admin has permission
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_admin_id
    AND wallet_address = ANY(
      string_to_array(current_setting('app.admin_wallet_addresses', true), ',')
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

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

COMMENT ON FUNCTION admin_unblock_user IS 'Admin function to unblock a previously banned user account';

-- ---------------------------------------------------------------------
-- 5. Update admin_recent_activity view to include new columns
-- ---------------------------------------------------------------------

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

-- Grant permissions (admin only via RLS)
GRANT SELECT ON public.admin_recent_activity TO authenticated;

-- ---------------------------------------------------------------------
-- 6. Update admin_top_creators view to include blocked status
-- ---------------------------------------------------------------------

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
GRANT SELECT ON public.admin_top_creators TO authenticated;

-- ---------------------------------------------------------------------
-- 7. Update admin_search_users function to include blocked status
-- ---------------------------------------------------------------------

DROP FUNCTION IF EXISTS admin_search_users(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION admin_search_users(
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  email TEXT,
  wallet_address TEXT,
  coffee_price DECIMAL(10, 2),
  is_active BOOLEAN,
  is_blocked BOOLEAN,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ,
  total_supports BIGINT,
  total_supporters BIGINT,
  total_earnings DECIMAL(10, 2),
  supports_last_30_days BIGINT,
  earnings_last_30_days DECIMAL(10, 2),
  last_support_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
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
    COALESCE(stats.total_supports, 0)::BIGINT AS total_supports,
    COALESCE(stats.total_supporters, 0)::BIGINT AS total_supporters,
    COALESCE(stats.total_earnings, 0)::DECIMAL(10, 2) AS total_earnings,
    COALESCE(stats_30d.supports_last_30_days, 0)::BIGINT AS supports_last_30_days,
    COALESCE(stats_30d.earnings_last_30_days, 0)::DECIMAL(10, 2) AS earnings_last_30_days,
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
  WHERE
    u.username ILIKE '%' || p_search_term || '%'
    OR u.display_name ILIKE '%' || p_search_term || '%'
    OR u.email ILIKE '%' || p_search_term || '%'
    OR u.wallet_address ILIKE '%' || p_search_term || '%'
  ORDER BY stats.total_earnings DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION admin_search_users IS 'Search users by username, email, or wallet (admin only)';

-- =====================================================================
-- End of Migration
-- =====================================================================
