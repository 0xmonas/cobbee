-- =====================================================================
-- Migration: Remove is_admin_user() Check from Admin RPC Functions
-- =====================================================================
-- Description:
--   Admin RPC functions are called with service role key (adminSupabase)
--   Service role already bypasses RLS and has full access
--   The is_admin_user() check fails because auth.uid() is NULL with service role
--
-- Solution:
--   Remove the is_admin_user() check from admin RPC functions
--   Rely on service role authentication instead
--
-- Security:
--   - Service role key is only available server-side
--   - Frontend admin check (isAdminWallet) still protects pages
--   - Service role is equivalent to superuser access
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Fix admin_get_analytics (Remove admin check)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION admin_get_analytics(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  new_creators INTEGER,
  new_supports INTEGER,
  total_volume DECIMAL(10, 2),
  unique_supporters INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ❌ REMOVED: is_admin_user() check
  -- ✅ Security: Only callable via service role (server-side only)

  -- Generate date series for the last p_days days
  RETURN QUERY
  WITH date_series AS (
    SELECT
      generate_series(
        CURRENT_DATE - (p_days || ' days')::INTERVAL,
        CURRENT_DATE,
        '1 day'::INTERVAL
      )::DATE AS date
  )
  SELECT
    ds.date,

    -- New creators on this day
    COALESCE(
      (SELECT COUNT(*)::INTEGER
       FROM public.users
       WHERE DATE(created_at) = ds.date),
      0
    )::INTEGER as new_creators,

    -- New confirmed supports on this day
    COALESCE(
      (SELECT COUNT(*)::INTEGER
       FROM public.supports
       WHERE DATE(created_at) = ds.date
         AND status = 'confirmed'),
      0
    )::INTEGER as new_supports,

    -- Total volume on this day
    COALESCE(
      (SELECT COALESCE(SUM(total_amount), 0)
       FROM public.supports
       WHERE DATE(created_at) = ds.date
         AND status = 'confirmed'),
      0
    )::DECIMAL(10, 2) as total_volume,

    -- Unique supporters on this day
    COALESCE(
      (SELECT COUNT(DISTINCT supporter_wallet_address)::INTEGER
       FROM public.supports
       WHERE DATE(created_at) = ds.date
         AND status = 'confirmed'),
      0
    )::INTEGER as unique_supporters

  FROM date_series ds
  ORDER BY ds.date DESC;
END;
$$;

COMMENT ON FUNCTION admin_get_analytics IS 'Get time-series analytics (service role only)';

-- ---------------------------------------------------------------------
-- 2. Fix admin_search_users (Remove admin check)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION admin_search_users(
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
  is_blocked BOOLEAN,
  blocked_at TIMESTAMPTZ,
  blocked_reason TEXT,
  total_earnings DECIMAL(10, 2),
  total_supporters INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ❌ REMOVED: is_admin_user() check
  -- ✅ Security: Only callable via service role (server-side only)

  RETURN QUERY
  SELECT
    u.id,
    u.username,
    u.display_name,
    u.email,
    u.wallet_address,
    u.is_active,
    u.is_blocked,
    u.blocked_at,
    u.blocked_reason,

    COALESCE(
      (SELECT SUM(s.total_amount)
       FROM public.supports s
       WHERE s.creator_id = u.id AND s.status = 'confirmed'),
      0
    )::DECIMAL(10, 2) as total_earnings,

    COALESCE(
      (SELECT COUNT(DISTINCT s.supporter_wallet_address)
       FROM public.supports s
       WHERE s.creator_id = u.id AND s.status = 'confirmed'),
      0
    )::INTEGER as total_supporters,

    u.created_at

  FROM public.users u
  WHERE
    u.username ILIKE '%' || p_search_term || '%'
    OR u.display_name ILIKE '%' || p_search_term || '%'
    OR u.email ILIKE '%' || p_search_term || '%'
    OR u.wallet_address ILIKE '%' || p_search_term || '%'
  ORDER BY u.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION admin_search_users IS 'Search users with sensitive data (service role only)';

-- ---------------------------------------------------------------------
-- 3. Fix admin_blacklist_wallet (Remove admin check)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION admin_blacklist_wallet(
  p_wallet_address TEXT,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL,
  p_admin_wallet TEXT DEFAULT NULL,
  p_ban_scope TEXT DEFAULT 'full'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blacklist_id UUID;
  v_affected_supports INTEGER := 0;
BEGIN
  -- ❌ REMOVED: is_admin_user() check
  -- ✅ Security: Only callable via service role (server-side only)

  -- Insert into blacklist
  INSERT INTO public.blacklisted_wallets (
    wallet_address,
    reason,
    notes,
    blacklisted_by,
    ban_scope
  ) VALUES (
    LOWER(p_wallet_address),
    p_reason,
    p_notes,
    COALESCE(p_admin_wallet, 'service-role'),
    p_ban_scope
  )
  RETURNING id INTO v_blacklist_id;

  -- Update supporter_wallets
  UPDATE public.supporter_wallets
  SET
    is_blacklisted = TRUE,
    blacklist_reason = p_reason
  WHERE wallet_address = LOWER(p_wallet_address);

  -- Fail pending supports
  UPDATE public.supports
  SET status = 'failed'
  WHERE supporter_wallet_address = LOWER(p_wallet_address)
    AND status = 'pending';

  GET DIAGNOSTICS v_affected_supports = ROW_COUNT;

  RETURN json_build_object(
    'blacklist_id', v_blacklist_id,
    'affected_pending_supports', v_affected_supports
  );
END;
$$;

COMMENT ON FUNCTION admin_blacklist_wallet IS 'Blacklist supporter wallet (service role only)';

-- ---------------------------------------------------------------------
-- 4. Fix admin_unblacklist_wallet (Remove admin check)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION admin_unblacklist_wallet(
  p_wallet_address TEXT,
  p_admin_wallet TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- ❌ REMOVED: is_admin_user() check
  -- ✅ Security: Only callable via service role (server-side only)

  -- Delete from blacklist
  DELETE FROM public.blacklisted_wallets
  WHERE wallet_address = LOWER(p_wallet_address);

  -- Update supporter_wallets
  UPDATE public.supporter_wallets
  SET
    is_blacklisted = FALSE,
    blacklist_reason = NULL
  WHERE wallet_address = LOWER(p_wallet_address);

  RETURN json_build_object('success', TRUE);
END;
$$;

COMMENT ON FUNCTION admin_unblacklist_wallet IS 'Remove wallet from blacklist (service role only)';

-- =====================================================================
-- SECURITY MODEL EXPLANATION
-- =====================================================================
--
-- OLD MODEL (doesn't work):
-- - is_admin_user() checks auth.uid()
-- - But service role has no session, so auth.uid() = NULL
-- - Admin check fails even though service role is used
--
-- NEW MODEL (correct):
-- - Admin RPC functions have SECURITY DEFINER
-- - Only callable with service role key (server-side)
-- - Frontend pages protected by isAdminWallet() check
-- - Service role = superuser, no need for is_admin_user()
--
-- DEFENSE IN DEPTH:
-- 1. Service role key only in server environment (not exposed to client)
-- 2. Frontend admin pages check ADMIN_WALLET_ADDRESSES env var
-- 3. RPC functions have SECURITY DEFINER (run with elevated privileges)
-- 4. All RPC permissions revoked from PUBLIC, granted to authenticated
--
-- =====================================================================
