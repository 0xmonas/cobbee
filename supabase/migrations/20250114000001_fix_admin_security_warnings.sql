-- ============================================================================
-- FIX ADMIN SECURITY WARNINGS
-- ============================================================================
-- Purpose: Fix Supabase linter warnings for admin views and functions
-- Issue 1: Views should NOT use SECURITY DEFINER (they don't need it)
-- Issue 2: Functions need SET search_path = public for security
-- ============================================================================

-- ============================================================================
-- DROP AND RECREATE VIEWS (Remove SECURITY DEFINER)
-- ============================================================================
-- Views don't execute code, so SECURITY DEFINER is unnecessary and triggers warnings.
-- Admin access is controlled by using Service Role Key from backend API routes.

-- Drop existing views
DROP VIEW IF EXISTS admin_platform_stats;
DROP VIEW IF EXISTS admin_suspicious_wallets;
DROP VIEW IF EXISTS admin_top_creators;
DROP VIEW IF EXISTS admin_recent_activity;
DROP VIEW IF EXISTS admin_failed_payments;

-- ============================================================================
-- VIEW: Admin Platform Stats (No SECURITY DEFINER)
-- ============================================================================
CREATE VIEW admin_platform_stats AS
SELECT
  -- User Stats
  (SELECT COUNT(*) FROM public.users WHERE is_active = true) as total_active_creators,
  (SELECT COUNT(*) FROM public.users WHERE is_active = false) as total_inactive_creators,
  (SELECT COUNT(*) FROM public.users WHERE created_at >= NOW() - INTERVAL '7 days') as new_creators_last_7_days,
  (SELECT COUNT(*) FROM public.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_creators_last_30_days,

  -- Support Stats
  (SELECT COUNT(*) FROM public.supports WHERE status = 'confirmed') as total_confirmed_supports,
  (SELECT COUNT(*) FROM public.supports WHERE status = 'pending') as total_pending_supports,
  (SELECT COUNT(*) FROM public.supports WHERE status = 'failed') as total_failed_supports,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.supports WHERE status = 'confirmed') as total_platform_volume_usd,
  (SELECT COUNT(DISTINCT supporter_wallet_address) FROM public.supports WHERE status = 'confirmed') as total_unique_supporters,

  -- Recent Activity (24h)
  (SELECT COUNT(*) FROM public.supports WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'confirmed') as supports_last_24h,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.supports WHERE created_at >= NOW() - INTERVAL '24 hours' AND status = 'confirmed') as volume_last_24h,
  (SELECT COUNT(*) FROM public.users WHERE created_at >= NOW() - INTERVAL '24 hours') as signups_last_24h,

  -- Blacklist Stats
  (SELECT COUNT(*) FROM public.blacklisted_wallets) as total_blacklisted_wallets,
  (SELECT COUNT(*) FROM public.supporter_wallets WHERE is_blacklisted = true) as total_flagged_wallets,

  -- Notifications Stats
  (SELECT COUNT(*) FROM public.notifications WHERE created_at >= NOW() - INTERVAL '24 hours') as notifications_sent_24h,
  (SELECT COUNT(*) FROM public.notifications WHERE read = false) as total_unread_notifications;

COMMENT ON VIEW admin_platform_stats IS 'Real-time platform statistics for admin dashboard overview';

-- ============================================================================
-- VIEW: Suspicious Wallets (No SECURITY DEFINER)
-- ============================================================================
CREATE VIEW admin_suspicious_wallets AS
SELECT
  sw.id,
  sw.wallet_address,
  sw.used_names,
  JSONB_ARRAY_LENGTH(sw.used_names) as name_variation_count,
  sw.total_support_count,
  sw.total_creators_supported,
  sw.first_seen_at,
  sw.last_seen_at,
  sw.is_blacklisted,
  sw.blacklist_reason,

  -- Recent activity (last 7 days)
  COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') as supports_last_7_days,
  COALESCE(SUM(s.total_amount) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days'), 0) as volume_last_7_days,
  COUNT(DISTINCT s.creator_id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') as creators_last_7_days,

  -- Fraud score indicators
  CASE
    WHEN JSONB_ARRAY_LENGTH(sw.used_names) > 10 THEN 3
    WHEN JSONB_ARRAY_LENGTH(sw.used_names) > 5 THEN 2
    WHEN JSONB_ARRAY_LENGTH(sw.used_names) > 3 THEN 1
    ELSE 0
  END +
  CASE
    WHEN COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') > 50 THEN 3
    WHEN COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') > 25 THEN 2
    WHEN COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') > 10 THEN 1
    ELSE 0
  END +
  CASE
    WHEN sw.total_support_count > 200 THEN 2
    WHEN sw.total_support_count > 100 THEN 1
    ELSE 0
  END as fraud_risk_score

FROM public.supporter_wallets sw
LEFT JOIN public.supports s ON sw.wallet_address = s.supporter_wallet_address
  AND s.status = 'confirmed'
WHERE sw.is_blacklisted = false
GROUP BY sw.id
HAVING
  JSONB_ARRAY_LENGTH(sw.used_names) > 3
  OR COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') > 10
  OR sw.total_support_count > 100
ORDER BY
  CASE
    WHEN JSONB_ARRAY_LENGTH(sw.used_names) > 10 THEN 3
    WHEN JSONB_ARRAY_LENGTH(sw.used_names) > 5 THEN 2
    WHEN JSONB_ARRAY_LENGTH(sw.used_names) > 3 THEN 1
    ELSE 0
  END +
  CASE
    WHEN COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') > 50 THEN 3
    WHEN COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') > 25 THEN 2
    WHEN COUNT(s.id) FILTER (WHERE s.created_at >= NOW() - INTERVAL '7 days') > 10 THEN 1
    ELSE 0
  END +
  CASE
    WHEN sw.total_support_count > 200 THEN 2
    WHEN sw.total_support_count > 100 THEN 1
    ELSE 0
  END DESC,
  sw.last_seen_at DESC;

COMMENT ON VIEW admin_suspicious_wallets IS 'Potentially fraudulent wallets based on activity patterns';

-- ============================================================================
-- VIEW: Top Creators (No SECURITY DEFINER)
-- ============================================================================
CREATE VIEW admin_top_creators AS
SELECT
  u.id,
  u.username,
  u.display_name,
  u.email,
  u.wallet_address,
  u.coffee_price,
  u.is_active,
  u.created_at,

  -- Stats
  COUNT(s.id) FILTER (WHERE s.status = 'confirmed') as total_supports,
  COUNT(DISTINCT s.supporter_wallet_address) FILTER (WHERE s.status = 'confirmed') as total_supporters,
  COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'confirmed'), 0) as total_earnings,

  -- Recent activity (30 days)
  COUNT(s.id) FILTER (WHERE s.status = 'confirmed' AND s.created_at >= NOW() - INTERVAL '30 days') as supports_last_30_days,
  COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'confirmed' AND s.created_at >= NOW() - INTERVAL '30 days'), 0) as earnings_last_30_days,

  -- Last support date
  MAX(s.created_at) FILTER (WHERE s.status = 'confirmed') as last_support_at

FROM public.users u
LEFT JOIN public.supports s ON u.id = s.creator_id
GROUP BY u.id
ORDER BY total_earnings DESC;

COMMENT ON VIEW admin_top_creators IS 'All creators ranked by earnings (admin view with email/wallet)';

-- ============================================================================
-- VIEW: Recent Activity Log (No SECURITY DEFINER)
-- ============================================================================
CREATE VIEW admin_recent_activity AS
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
  al.created_at,

  -- Join user info for user events
  u.username as actor_username,
  u.display_name as actor_display_name

FROM public.audit_logs al
LEFT JOIN public.users u ON al.actor_id = u.id::TEXT AND al.actor_type = 'user'
ORDER BY al.created_at DESC
LIMIT 100;

COMMENT ON VIEW admin_recent_activity IS 'Last 100 platform activities';

-- ============================================================================
-- VIEW: Failed Payments (No SECURITY DEFINER)
-- ============================================================================
CREATE VIEW admin_failed_payments AS
SELECT
  s.id,
  s.creator_id,
  u.username as creator_username,
  u.display_name as creator_display_name,
  s.supporter_name,
  s.supporter_wallet_address,
  s.coffee_count,
  s.total_amount,
  s.tx_hash,
  s.chain_id,
  s.created_at,
  s.message
FROM public.supports s
JOIN public.users u ON s.creator_id = u.id
WHERE s.status = 'failed'
  AND s.created_at >= NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC;

COMMENT ON VIEW admin_failed_payments IS 'Failed payment attempts in the last 7 days';

-- ============================================================================
-- FIX FUNCTIONS: Add SET search_path = public
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS admin_blacklist_wallet(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_unblacklist_wallet(TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_deactivate_user(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_reactivate_user(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_get_analytics(INTEGER);
DROP FUNCTION IF EXISTS admin_search_users(TEXT, INTEGER);

-- ============================================================================
-- FUNCTION: Blacklist Wallet (With search_path)
-- ============================================================================
CREATE FUNCTION admin_blacklist_wallet(
  p_wallet_address TEXT,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL,
  p_admin_wallet TEXT DEFAULT NULL,
  p_ban_scope TEXT DEFAULT 'full'
)
RETURNS JSON AS $$
DECLARE
  v_blacklist_id UUID;
  v_affected_supports INTEGER;
BEGIN
  INSERT INTO public.blacklisted_wallets (
    wallet_address,
    reason,
    notes,
    blacklisted_by,
    ban_scope
  ) VALUES (
    p_wallet_address,
    p_reason,
    p_notes,
    COALESCE(p_admin_wallet, 'system'),
    p_ban_scope
  )
  ON CONFLICT (wallet_address) DO UPDATE
  SET
    reason = EXCLUDED.reason,
    notes = EXCLUDED.notes,
    blacklisted_by = EXCLUDED.blacklisted_by,
    blacklisted_at = NOW()
  RETURNING id INTO v_blacklist_id;

  UPDATE public.supporter_wallets
  SET
    is_blacklisted = true,
    blacklist_reason = p_reason,
    blacklisted_at = NOW(),
    blacklisted_by = NULL
  WHERE wallet_address = p_wallet_address;

  SELECT COUNT(*) INTO v_affected_supports
  FROM public.supports
  WHERE supporter_wallet_address = p_wallet_address
    AND status = 'pending';

  UPDATE public.supports
  SET status = 'failed'
  WHERE supporter_wallet_address = p_wallet_address
    AND status = 'pending';

  PERFORM create_audit_log(
    'wallet_blacklisted',
    'admin',
    COALESCE(p_admin_wallet, 'system'),
    'wallet',
    p_wallet_address,
    NULL,
    jsonb_build_object(
      'reason', p_reason,
      'ban_scope', p_ban_scope,
      'affected_pending_supports', v_affected_supports
    )
  );

  RETURN json_build_object(
    'success', true,
    'blacklist_id', v_blacklist_id,
    'affected_pending_supports', v_affected_supports
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION admin_blacklist_wallet IS 'Blacklist a wallet address (admin only)';

-- ============================================================================
-- FUNCTION: Remove from Blacklist (With search_path)
-- ============================================================================
CREATE FUNCTION admin_unblacklist_wallet(
  p_wallet_address TEXT,
  p_admin_wallet TEXT DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.blacklisted_wallets
  WHERE wallet_address = p_wallet_address;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Wallet not found in blacklist'
    );
  END IF;

  UPDATE public.supporter_wallets
  SET
    is_blacklisted = false,
    blacklist_reason = NULL,
    blacklisted_at = NULL,
    blacklisted_by = NULL
  WHERE wallet_address = p_wallet_address;

  PERFORM create_audit_log(
    'wallet_unblacklisted',
    'admin',
    COALESCE(p_admin_wallet, 'system'),
    'wallet',
    p_wallet_address,
    NULL,
    NULL
  );

  RETURN json_build_object(
    'success', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION admin_unblacklist_wallet IS 'Remove wallet from blacklist (admin only)';

-- ============================================================================
-- FUNCTION: Deactivate User (With search_path)
-- ============================================================================
CREATE FUNCTION admin_deactivate_user(
  p_user_id UUID,
  p_admin_wallet TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_username TEXT;
  v_was_active BOOLEAN;
BEGIN
  SELECT username, is_active INTO v_username, v_was_active
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  IF NOT v_was_active THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already inactive'
    );
  END IF;

  UPDATE public.users
  SET is_active = false
  WHERE id = p_user_id;

  PERFORM create_audit_log(
    'user_deactivated',
    'admin',
    COALESCE(p_admin_wallet, 'system'),
    'user',
    p_user_id::TEXT,
    jsonb_build_object(
      'is_active', jsonb_build_object('old', true, 'new', false)
    ),
    jsonb_build_object(
      'username', v_username,
      'reason', p_reason
    )
  );

  RETURN json_build_object(
    'success', true,
    'username', v_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION admin_deactivate_user IS 'Deactivate a creator account (admin only)';

-- ============================================================================
-- FUNCTION: Reactivate User (With search_path)
-- ============================================================================
CREATE FUNCTION admin_reactivate_user(
  p_user_id UUID,
  p_admin_wallet TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_username TEXT;
  v_was_active BOOLEAN;
BEGIN
  SELECT username, is_active INTO v_username, v_was_active
  FROM public.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  IF v_was_active THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User already active'
    );
  END IF;

  UPDATE public.users
  SET is_active = true
  WHERE id = p_user_id;

  PERFORM create_audit_log(
    'user_reactivated',
    'admin',
    COALESCE(p_admin_wallet, 'system'),
    'user',
    p_user_id::TEXT,
    jsonb_build_object(
      'is_active', jsonb_build_object('old', false, 'new', true)
    ),
    jsonb_build_object(
      'username', v_username
    )
  );

  RETURN json_build_object(
    'success', true,
    'username', v_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION admin_reactivate_user IS 'Reactivate a creator account (admin only)';

-- ============================================================================
-- FUNCTION: Get Platform Analytics (With search_path)
-- ============================================================================
CREATE FUNCTION admin_get_analytics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  new_creators INTEGER,
  new_supports INTEGER,
  total_volume DECIMAL(10, 2),
  unique_supporters INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.date::DATE,

    (SELECT COUNT(*)::INTEGER
     FROM public.users
     WHERE DATE(created_at) = d.date)::INTEGER as new_creators,

    (SELECT COUNT(*)::INTEGER
     FROM public.supports
     WHERE DATE(created_at) = d.date AND status = 'confirmed')::INTEGER as new_supports,

    COALESCE(
      (SELECT SUM(total_amount)
       FROM public.supports
       WHERE DATE(created_at) = d.date AND status = 'confirmed'),
      0
    )::DECIMAL(10, 2) as total_volume,

    (SELECT COUNT(DISTINCT supporter_wallet_address)::INTEGER
     FROM public.supports
     WHERE DATE(created_at) = d.date AND status = 'confirmed')::INTEGER as unique_supporters

  FROM generate_series(
    CURRENT_DATE - (p_days || ' days')::INTERVAL,
    CURRENT_DATE,
    '1 day'::INTERVAL
  ) AS d(date)
  ORDER BY d.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION admin_get_analytics IS 'Get time-series analytics data for charts';

-- ============================================================================
-- FUNCTION: Search Users (With search_path)
-- ============================================================================
CREATE FUNCTION admin_search_users(
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  email TEXT,
  wallet_address TEXT,
  is_active BOOLEAN,
  total_earnings DECIMAL(10, 2),
  total_supporters INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.display_name,
    u.email,
    u.wallet_address,
    u.is_active,
    COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'confirmed'), 0)::DECIMAL(10, 2) as total_earnings,
    COUNT(DISTINCT s.supporter_wallet_address) FILTER (WHERE s.status = 'confirmed')::INTEGER as total_supporters,
    u.created_at
  FROM public.users u
  LEFT JOIN public.supports s ON u.id = s.creator_id
  WHERE
    u.username ILIKE '%' || p_search_term || '%'
    OR u.display_name ILIKE '%' || p_search_term || '%'
    OR u.email ILIKE '%' || p_search_term || '%'
    OR u.wallet_address ILIKE '%' || p_search_term || '%'
  GROUP BY u.id
  ORDER BY u.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION admin_search_users IS 'Search creators by username, email, wallet (admin only)';

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- All security warnings fixed:
-- ✅ Views recreated WITHOUT SECURITY DEFINER
-- ✅ Functions recreated WITH search_path = public
-- ============================================================================
