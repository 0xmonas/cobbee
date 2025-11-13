-- ============================================================================
-- RECREATE ADMIN VIEWS WITHOUT SECURITY DEFINER
-- ============================================================================
-- Purpose: Create admin views without SECURITY DEFINER to avoid linter warnings
-- Admin access is controlled by Service Role Key from backend API routes
-- ============================================================================

-- ============================================================================
-- VIEW: Admin Platform Stats
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
-- VIEW: Suspicious Wallets
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
-- VIEW: Top Creators
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
-- VIEW: Recent Activity Log
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
-- VIEW: Failed Payments
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
-- COMPLETE
-- ============================================================================
-- All admin views recreated WITHOUT SECURITY DEFINER
-- These views are safe and will not trigger linter warnings
-- ============================================================================
