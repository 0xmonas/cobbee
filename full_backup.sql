


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_admin_wallet"("p_wallet_address" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
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


ALTER FUNCTION "public"."add_admin_wallet"("p_wallet_address" "text", "p_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_admin_wallet"("p_wallet_address" "text", "p_notes" "text") IS 'Add new admin wallet (admin-only)';



CREATE OR REPLACE FUNCTION "public"."admin_blacklist_wallet"("p_wallet_address" "text", "p_reason" "text", "p_notes" "text" DEFAULT NULL::"text", "p_admin_wallet" "text" DEFAULT NULL::"text", "p_ban_scope" "text" DEFAULT 'full'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_blacklist_id UUID;
  v_affected_supports INTEGER;
BEGIN
  -- ✅ SECURITY CHECK: Verify caller is admin
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can blacklist wallets';
  END IF;

  -- Insert into blacklist
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

  -- Update supporter_wallets table
  UPDATE public.supporter_wallets
  SET
    is_blacklisted = true,
    blacklist_reason = p_reason,
    blacklisted_at = NOW(),
    blacklisted_by = NULL
  WHERE wallet_address = p_wallet_address;

  -- Count affected pending supports
  SELECT COUNT(*) INTO v_affected_supports
  FROM public.supports
  WHERE supporter_wallet_address = p_wallet_address
    AND status = 'pending';

  -- Fail all pending supports from this wallet
  UPDATE public.supports
  SET status = 'failed'
  WHERE supporter_wallet_address = p_wallet_address
    AND status = 'pending';

  -- Create audit log
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
$$;


ALTER FUNCTION "public"."admin_blacklist_wallet"("p_wallet_address" "text", "p_reason" "text", "p_notes" "text", "p_admin_wallet" "text", "p_ban_scope" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_blacklist_wallet"("p_wallet_address" "text", "p_reason" "text", "p_notes" "text", "p_admin_wallet" "text", "p_ban_scope" "text") IS 'Blacklist a supporter wallet for fraud prevention (admin only). Automatically fails pending supports from this wallet.';



CREATE OR REPLACE FUNCTION "public"."admin_block_user"("p_user_id" "uuid", "p_admin_id" "uuid", "p_reason" "text" DEFAULT 'Violation of platform policies'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."admin_block_user"("p_user_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_block_user"("p_user_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") IS 'Admin function to block/ban a user account';



CREATE OR REPLACE FUNCTION "public"."admin_get_analytics"("p_days" integer DEFAULT 30) RETURNS TABLE("date" "date", "new_creators" integer, "new_supports" integer, "total_volume" numeric, "unique_supporters" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- ✅ SECURITY CHECK: Verify caller is admin
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view analytics';
  END IF;

  RETURN QUERY
  SELECT
    d.date::DATE,

    -- New creators on this day
    (SELECT COUNT(*)::INTEGER
     FROM public.users
     WHERE DATE(created_at) = d.date)::INTEGER as new_creators,

    -- New confirmed supports on this day
    (SELECT COUNT(*)::INTEGER
     FROM public.supports
     WHERE DATE(created_at) = d.date AND status = 'confirmed')::INTEGER as new_supports,

    -- Total volume on this day
    COALESCE(
      (SELECT SUM(total_amount)
       FROM public.supports
       WHERE DATE(created_at) = d.date AND status = 'confirmed'),
      0
    )::DECIMAL(10, 2) as total_volume,

    -- Unique supporters on this day
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
$$;


ALTER FUNCTION "public"."admin_get_analytics"("p_days" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_get_analytics"("p_days" integer) IS 'Get time-series analytics data for charts (admin only)';



CREATE OR REPLACE FUNCTION "public"."admin_search_users"("p_search_term" "text", "p_limit" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "username" "text", "display_name" "text", "email" "text", "wallet_address" "text", "is_active" boolean, "is_blocked" boolean, "blocked_at" timestamp with time zone, "blocked_reason" "text", "total_earnings" numeric, "total_supporters" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- ✅ SECURITY CHECK: Verify caller is admin
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can search users';
  END IF;

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
$$;


ALTER FUNCTION "public"."admin_search_users"("p_search_term" "text", "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_search_users"("p_search_term" "text", "p_limit" integer) IS 'Search creators by username, email, wallet address (admin only). Returns blocking status.';



CREATE OR REPLACE FUNCTION "public"."admin_unblacklist_wallet"("p_wallet_address" "text", "p_admin_wallet" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- ✅ SECURITY CHECK: Verify caller is admin
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can unblacklist wallets';
  END IF;

  -- Delete from blacklist
  DELETE FROM public.blacklisted_wallets
  WHERE wallet_address = p_wallet_address;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Wallet not found in blacklist'
    );
  END IF;

  -- Update supporter_wallets table
  UPDATE public.supporter_wallets
  SET
    is_blacklisted = false,
    blacklist_reason = NULL,
    blacklisted_at = NULL,
    blacklisted_by = NULL
  WHERE wallet_address = p_wallet_address;

  -- Create audit log
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
$$;


ALTER FUNCTION "public"."admin_unblacklist_wallet"("p_wallet_address" "text", "p_admin_wallet" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_unblacklist_wallet"("p_wallet_address" "text", "p_admin_wallet" "text") IS 'Remove supporter wallet from blacklist (admin only)';



CREATE OR REPLACE FUNCTION "public"."admin_unblock_user"("p_user_id" "uuid", "p_admin_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."admin_unblock_user"("p_user_id" "uuid", "p_admin_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_unblock_user"("p_user_id" "uuid", "p_admin_id" "uuid") IS 'Admin function to unblock a previously banned user account';



CREATE OR REPLACE FUNCTION "public"."check_and_notify_milestones"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
  v_total_supporters INTEGER;
  v_total_earnings DECIMAL(10, 2);
  v_monthly_earnings DECIMAL(10, 2);
BEGIN
  -- Only check milestones on confirmed supports
  IF NEW.status = 'confirmed' THEN

    -- Get total supporters count
    SELECT COUNT(DISTINCT supporter_wallet_address)
    INTO v_total_supporters
    FROM public.supports
    WHERE creator_id = NEW.creator_id
      AND status = 'confirmed';

    -- Get total earnings
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_earnings
    FROM public.supports
    WHERE creator_id = NEW.creator_id
      AND status = 'confirmed';

    -- Get monthly earnings
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_monthly_earnings
    FROM public.supports
    WHERE creator_id = NEW.creator_id
      AND status = 'confirmed'
      AND created_at >= DATE_TRUNC('month', NOW());

    -- Check supporter milestones (10, 25, 50, 100, 250, 500, 1000)
    IF v_total_supporters IN (10, 25, 50, 100, 250, 500, 1000) THEN
      -- Check if milestone notification already exists (prevent duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE user_id = NEW.creator_id
          AND type = 'milestone'
          AND metadata->>'milestone_type' = 'supporters'
          AND (metadata->>'milestone_value')::INTEGER = v_total_supporters
      ) THEN
        PERFORM create_notification(
          p_user_id := NEW.creator_id,
          p_type := 'milestone',
          p_title := 'Milestone Reached!',
          p_message := 'Congratulations! You reached ' || v_total_supporters || ' supporters!',
          p_related_support_id := NULL,
          p_metadata := jsonb_build_object(
            'milestone_type', 'supporters',
            'milestone_value', v_total_supporters
          )
        );
      END IF;
    END IF;

    -- Check earnings milestones ($100, $250, $500, $1000)
    IF v_total_earnings >= 100 AND v_total_earnings < 100 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Amazing! You''ve earned over $100!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 100
        )
      );
    ELSIF v_total_earnings >= 250 AND v_total_earnings < 250 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Incredible! You''ve earned over $250!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 250
        )
      );
    ELSIF v_total_earnings >= 500 AND v_total_earnings < 500 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Wow! You''ve earned over $500!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 500
        )
      );
    ELSIF v_total_earnings >= 1000 AND v_total_earnings < 1000 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Earnings Milestone!',
        p_message := 'Fantastic! You''ve earned over $1,000!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'earnings',
          'milestone_value', 1000
        )
      );
    END IF;

    -- Check monthly earnings milestones ($100, $500, $1000)
    IF v_monthly_earnings >= 100 AND v_monthly_earnings < 100 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Monthly Milestone!',
        p_message := 'Great! You''ve earned $100 this month!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'monthly_earnings',
          'milestone_value', 100
        )
      );
    ELSIF v_monthly_earnings >= 500 AND v_monthly_earnings < 500 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Monthly Milestone!',
        p_message := 'Amazing! You''ve earned $500 this month!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'monthly_earnings',
          'milestone_value', 500
        )
      );
    ELSIF v_monthly_earnings >= 1000 AND v_monthly_earnings < 1000 + NEW.total_amount THEN
      PERFORM create_notification(
        p_user_id := NEW.creator_id,
        p_type := 'milestone',
        p_title := 'Monthly Milestone!',
        p_message := 'Incredible! You''ve earned $1,000 this month!',
        p_related_support_id := NULL,
        p_metadata := jsonb_build_object(
          'milestone_type', 'monthly_earnings',
          'milestone_value', 1000
        )
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."check_and_notify_milestones"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_and_notify_milestones"() IS 'Checks for milestone achievements and creates notifications - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."cleanup_expired_otps"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM public.email_verifications
  WHERE expires_at < NOW() AND verified = FALSE;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_otps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_user_files"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'storage'
    AS $_$
BEGIN
  -- Delete avatar if exists (works with Supabase URLs and custom domain)
  IF OLD.avatar_url IS NOT NULL
     AND (OLD.avatar_url LIKE '%/avatars/%' OR OLD.avatar_url LIKE '%avatars/%') THEN
    DECLARE
      avatar_path TEXT;
    BEGIN
      avatar_path := substring(OLD.avatar_url from '/avatars/(.+)$');
      IF avatar_path IS NOT NULL THEN
        DELETE FROM storage.objects
        WHERE bucket_id = 'avatars'
          AND name = avatar_path;
      END IF;
    END;
  END IF;

  -- Delete cover if exists (works with Supabase URLs and custom domain)
  IF OLD.cover_image_url IS NOT NULL
     AND (OLD.cover_image_url LIKE '%/covers/%' OR OLD.cover_image_url LIKE '%covers/%') THEN
    DECLARE
      cover_path TEXT;
    BEGIN
      cover_path := substring(OLD.cover_image_url from '/covers/(.+)$');
      IF cover_path IS NOT NULL THEN
        DELETE FROM storage.objects
        WHERE bucket_id = 'covers'
          AND name = cover_path;
      END IF;
    END;
  END IF;

  RETURN OLD;
END;
$_$;


ALTER FUNCTION "public"."cleanup_user_files"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_user_files"() IS 'Cleanup all user files (avatar + cover) when user account is deleted. Security: search_path set to public, storage to prevent schema injection.';



CREATE OR REPLACE FUNCTION "public"."clear_all_notifications"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE user_id = auth.uid();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION "public"."clear_all_notifications"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clear_all_notifications"() IS 'Delete all notifications for current user - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."create_audit_log"("p_event_type" "text", "p_actor_type" "text", "p_actor_id" "text", "p_target_type" "text" DEFAULT NULL::"text", "p_target_id" "text" DEFAULT NULL::"text", "p_changes" "jsonb" DEFAULT NULL::"jsonb", "p_metadata" "jsonb" DEFAULT NULL::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    target_type,
    target_id,
    changes,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_event_type,
    p_actor_type,
    p_actor_id,
    p_target_type,
    p_target_id,
    p_changes,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."create_audit_log"("p_event_type" "text", "p_actor_type" "text", "p_actor_id" "text", "p_target_type" "text", "p_target_id" "text", "p_changes" "jsonb", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_related_support_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    related_support_id,
    metadata,
    read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_related_support_id,
    p_metadata,
    false,
    NOW()
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_related_support_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_related_support_id" "uuid", "p_metadata" "jsonb") IS 'Helper function to create notifications (called by triggers) - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."create_support"("p_creator_username" "text", "p_supporter_name" "text", "p_supporter_wallet" "text", "p_coffee_count" integer, "p_message" "text", "p_tx_hash" "text", "p_chain_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_creator_id UUID;
  v_coffee_price DECIMAL(10, 2);
  v_total_amount DECIMAL(10, 2);
  v_support_id UUID;
  v_is_blacklisted BOOLEAN;
BEGIN
  -- Check if wallet is blacklisted
  SELECT is_wallet_blacklisted(p_supporter_wallet) INTO v_is_blacklisted;
  IF v_is_blacklisted THEN
    RAISE EXCEPTION 'Wallet is blacklisted';
  END IF;

  -- Get creator info
  SELECT id, coffee_price INTO v_creator_id, v_coffee_price
  FROM public.users
  WHERE username = p_creator_username AND is_active = true;

  IF v_creator_id IS NULL THEN
    RAISE EXCEPTION 'Creator not found or inactive';
  END IF;

  -- Calculate total
  v_total_amount := v_coffee_price * p_coffee_count;

  -- Insert support
  INSERT INTO public.supports (
    creator_id,
    supporter_name,
    supporter_wallet_address,
    coffee_count,
    coffee_price_at_time,
    total_amount,
    message,
    tx_hash,
    chain_id,
    status
  ) VALUES (
    v_creator_id,
    p_supporter_name,
    p_supporter_wallet,
    p_coffee_count,
    v_coffee_price,
    v_total_amount,
    p_message,
    p_tx_hash,
    p_chain_id,
    'pending'
  )
  RETURNING id INTO v_support_id;

  -- Create audit log
  PERFORM create_audit_log(
    'support_created',
    'system',
    p_supporter_wallet,
    'support',
    v_support_id::TEXT,
    NULL,
    jsonb_build_object(
      'creator_username', p_creator_username,
      'amount', v_total_amount,
      'tx_hash', p_tx_hash
    )
  );

  RETURN json_build_object(
    'success', true,
    'support_id', v_support_id,
    'total_amount', v_total_amount
  );
END;
$$;


ALTER FUNCTION "public"."create_support"("p_creator_username" "text", "p_supporter_name" "text", "p_supporter_wallet" "text", "p_coffee_count" integer, "p_message" "text", "p_tx_hash" "text", "p_chain_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_notification"("p_notification_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE id = p_notification_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."delete_notification"("p_notification_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_notification"("p_notification_id" "uuid") IS 'Delete a single notification - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."delete_old_avatar"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'storage'
    AS $_$
BEGIN
  IF OLD.avatar_url IS NOT NULL
     AND OLD.avatar_url != NEW.avatar_url
     AND (OLD.avatar_url LIKE '%/avatars/%' OR OLD.avatar_url LIKE '%avatars/%') THEN
    -- Extract file path from URL (supports both formats)
    -- Format 1: https://xxx.supabase.co/storage/v1/object/public/avatars/{userId}/avatar.jpg
    -- Format 2: https://cobbee.fun/avatars/{userId}/avatar.jpg (or any custom domain)
    DECLARE
      old_path TEXT;
    BEGIN
      old_path := substring(OLD.avatar_url from '/avatars/(.+)$');
      IF old_path IS NOT NULL THEN
        DELETE FROM storage.objects
        WHERE bucket_id = 'avatars'
          AND name = old_path;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."delete_old_avatar"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_old_avatar"() IS 'Cleanup old avatar file when user updates their avatar URL. Security: search_path set to public, storage to prevent schema injection.';



CREATE OR REPLACE FUNCTION "public"."delete_old_cover"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'storage'
    AS $_$
BEGIN
  IF OLD.cover_image_url IS NOT NULL
     AND OLD.cover_image_url != NEW.cover_image_url
     AND (OLD.cover_image_url LIKE '%/covers/%' OR OLD.cover_image_url LIKE '%covers/%') THEN
    -- Extract file path from URL (supports both formats)
    -- Format 1: https://xxx.supabase.co/storage/v1/object/public/covers/{userId}/cover.jpg
    -- Format 2: https://cobbee.fun/covers/{userId}/cover.jpg (or any custom domain)
    DECLARE
      old_path TEXT;
    BEGIN
      old_path := substring(OLD.cover_image_url from '/covers/(.+)$');
      IF old_path IS NOT NULL THEN
        DELETE FROM storage.objects
        WHERE bucket_id = 'covers'
          AND name = old_path;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."delete_old_cover"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_old_cover"() IS 'Cleanup old cover file when user updates their cover URL. Security: search_path set to public, storage to prevent schema injection.';



CREATE OR REPLACE FUNCTION "public"."get_unread_notification_count"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND read = false;

  RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."get_unread_notification_count"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_unread_notification_count"() IS 'Get count of unread notifications for current user - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."is_admin_user"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
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


ALTER FUNCTION "public"."is_admin_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin_user"() IS 'Returns TRUE if current user is an admin based on wallet address';



CREATE OR REPLACE FUNCTION "public"."is_wallet_blacklisted"("p_wallet_address" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_is_blacklisted BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.blacklisted_wallets
    WHERE wallet_address = p_wallet_address
  ) INTO v_is_blacklisted;
  RETURN v_is_blacklisted;
END;
$$;


ALTER FUNCTION "public"."is_wallet_blacklisted"("p_wallet_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_login"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
  v_wallet_address TEXT;
BEGIN
  -- Get user info from public.users
  SELECT username, display_name, wallet_address
  INTO v_username, v_display_name, v_wallet_address
  FROM public.users
  WHERE id = NEW.user_id;

  -- Only log if user exists in public.users (skip service/system sessions)
  IF v_username IS NOT NULL THEN
    -- Insert audit log for login
    INSERT INTO public.audit_logs (
      event_type,
      actor_type,
      actor_id,
      target_type,
      target_id,
      metadata,
      session_id,
      created_at
    ) VALUES (
      'user_login',
      'user',
      NEW.user_id,
      'user',
      NEW.user_id,
      jsonb_build_object(
        'username', v_username,
        'display_name', v_display_name,
        'wallet_address', v_wallet_address,
        'login_method', 'wallet'
      ),
      NEW.id::TEXT, -- Session ID for tracking
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_user_login"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_user_login"() IS 'Trigger function to log user login events via auth.sessions';



CREATE OR REPLACE FUNCTION "public"."log_user_logout"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Get user info
  SELECT username INTO v_username
  FROM public.users
  WHERE id = OLD.user_id;

  -- Only log if user exists
  IF v_username IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      event_type,
      actor_type,
      actor_id,
      target_type,
      target_id,
      metadata,
      session_id,
      created_at
    ) VALUES (
      'user_logout',
      'user',
      OLD.user_id,
      'user',
      OLD.user_id,
      jsonb_build_object(
        'username', v_username,
        'session_duration_seconds', EXTRACT(EPOCH FROM (NOW() - OLD.created_at))::INTEGER
      ),
      OLD.id::TEXT,
      NOW()
    );
  END IF;

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."log_user_logout"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_user_logout"() IS 'Trigger function to log user logout events';



CREATE OR REPLACE FUNCTION "public"."log_user_signup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  -- Insert audit log for new user signup
  INSERT INTO public.audit_logs (
    event_type,
    actor_type,
    actor_id,
    target_type,
    target_id,
    metadata,
    created_at
  ) VALUES (
    'user_signup',
    'user',
    NEW.id,
    'user',
    NEW.id,
    jsonb_build_object(
      'username', NEW.username,
      'display_name', NEW.display_name,
      'wallet_address', NEW.wallet_address,
      'signup_method', 'wallet'
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_user_signup"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_user_signup"() IS 'Trigger function to log user signup events to audit_logs';



CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = NOW()
  WHERE user_id = auth.uid()
    AND read = false;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_all_notifications_read"() IS 'Mark all unread notifications as read for current user - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  UPDATE public.notifications
  SET read = true, read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()
    AND read = false;

  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") IS 'Mark a single notification as read - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."notify_creator_on_support"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_creator_display_name TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only notify on confirmed supports
  IF NEW.status = 'confirmed' THEN
    -- Get creator's display name (for metadata, not required)
    SELECT display_name INTO v_creator_display_name
    FROM public.users
    WHERE id = NEW.creator_id;

    -- Build notification message
    IF NEW.coffee_count = 1 THEN
      v_notification_title := 'New Coffee Support!';
      v_notification_message := NEW.supporter_name || ' bought you a coffee!';
    ELSE
      v_notification_title := 'New Coffee Support!';
      v_notification_message := NEW.supporter_name || ' bought you ' || NEW.coffee_count || ' coffees!';
    END IF;

    -- Create notification
    PERFORM create_notification(
      p_user_id := NEW.creator_id,
      p_type := 'support',
      p_title := v_notification_title,
      p_message := v_notification_message,
      p_related_support_id := NEW.id,
      p_metadata := jsonb_build_object(
        'supporter_name', NEW.supporter_name,
        'supporter_wallet', NEW.supporter_wallet_address,
        'coffee_count', NEW.coffee_count,
        'total_amount', NEW.total_amount,
        'has_message', (NEW.message IS NOT NULL AND NEW.message != ''),
        'message_preview', CASE
          WHEN NEW.message IS NOT NULL AND NEW.message != ''
          THEN LEFT(NEW.message, 100)
          ELSE NULL
        END
      )
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_creator_on_support"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_creator_on_support"() IS 'Creates notification when a support is confirmed - SECURITY: search_path set';



CREATE OR REPLACE FUNCTION "public"."remove_admin_wallet"("p_wallet_address" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
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


ALTER FUNCTION "public"."remove_admin_wallet"("p_wallet_address" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."remove_admin_wallet"("p_wallet_address" "text") IS 'Remove admin wallet (admin-only, cannot remove self)';



CREATE OR REPLACE FUNCTION "public"."track_supporter_wallet"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_names JSONB;
BEGIN
  -- Check if wallet exists in tracking table
  SELECT used_names INTO v_current_names
  FROM supporter_wallets
  WHERE wallet_address = NEW.supporter_wallet_address;

  IF FOUND THEN
    -- Update existing wallet tracking
    UPDATE supporter_wallets
    SET
      -- Add name to array if not already present
      used_names = CASE
        WHEN NOT (used_names @> to_jsonb(NEW.supporter_name))
        THEN used_names || to_jsonb(NEW.supporter_name)
        ELSE used_names
      END,
      total_support_count = total_support_count + 1,
      total_creators_supported = (
        SELECT COUNT(DISTINCT creator_id)
        FROM supports
        WHERE supporter_wallet_address = NEW.supporter_wallet_address
          AND status = 'confirmed'
      ),
      last_seen_at = NOW()
    WHERE wallet_address = NEW.supporter_wallet_address;
  ELSE
    -- Insert new wallet tracking
    INSERT INTO supporter_wallets (
      wallet_address,
      used_names,
      total_support_count,
      total_creators_supported
    ) VALUES (
      NEW.supporter_wallet_address,
      to_jsonb(ARRAY[NEW.supporter_name]),
      1,
      1
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_supporter_wallet"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."track_supporter_wallet"() IS 'Automatically tracks supporter wallet activity when support is confirmed. SECURITY DEFINER allows bypassing RLS. search_path is explicitly set for security.';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."supports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "supporter_name" "text" NOT NULL,
    "supporter_wallet_address" "text" NOT NULL,
    "supporter_avatar_url" "text",
    "coffee_count" integer NOT NULL,
    "coffee_price_at_time" numeric(10,2) NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "tx_hash" "text" NOT NULL,
    "chain_id" integer NOT NULL,
    "message" "text",
    "is_message_private" boolean DEFAULT false,
    "is_hidden_by_creator" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    CONSTRAINT "coffee_count_range" CHECK ((("coffee_count" > 0) AND ("coffee_count" <= 100))),
    CONSTRAINT "message_length" CHECK (("char_length"("message") <= 500)),
    CONSTRAINT "status_values" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'failed'::"text"]))),
    CONSTRAINT "total_amount_positive" CHECK (("total_amount" > (0)::numeric))
);


ALTER TABLE "public"."supports" OWNER TO "postgres";


COMMENT ON TABLE "public"."supports" IS 'All support transactions (creator-centric view)';



COMMENT ON COLUMN "public"."supports"."coffee_price_at_time" IS 'Price frozen when support initiated (prevents creator price change manipulation)';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "wallet_address" "text",
    "email" "text",
    "email_verified" boolean DEFAULT false,
    "username" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "bio" "text",
    "avatar_url" "text",
    "cover_image_url" "text",
    "twitter_handle" "text",
    "instagram_handle" "text",
    "github_handle" "text",
    "tiktok_handle" "text",
    "opensea_handle" "text",
    "coffee_price" numeric(10,2) DEFAULT 5.00,
    "is_active" boolean DEFAULT true,
    "email_notifications_new_support" boolean DEFAULT true,
    "email_notifications_security" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "thank_you_message" "text",
    "is_blocked" boolean DEFAULT false NOT NULL,
    "blocked_at" timestamp with time zone,
    "blocked_reason" "text",
    "blocked_by" "uuid",
    CONSTRAINT "auth_method" CHECK ((("wallet_address" IS NOT NULL) OR ("email" IS NOT NULL))),
    CONSTRAINT "bio_length" CHECK (("char_length"("bio") <= 500)),
    CONSTRAINT "coffee_price_positive" CHECK ((("coffee_price" > (0)::numeric) AND ("coffee_price" <= (1000)::numeric))),
    CONSTRAINT "email_format" CHECK ((("email" IS NULL) OR ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text"))),
    CONSTRAINT "username_format" CHECK (("username" ~* '^[a-z0-9_-]{3,30}$'::"text"))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'Creator accounts linked to auth.users. Auth via Supabase: wallet (SIWE) or email (OTP)';



COMMENT ON COLUMN "public"."users"."id" IS 'References auth.users(id) - managed by Supabase Auth';



COMMENT ON COLUMN "public"."users"."wallet_address" IS 'Nullable - filled for Web3 auth users';



COMMENT ON COLUMN "public"."users"."email" IS 'Nullable - filled for email auth users';



COMMENT ON COLUMN "public"."users"."thank_you_message" IS 'Custom thank you message shown to supporters after they send coffee';



COMMENT ON COLUMN "public"."users"."is_blocked" IS 'Whether user account is blocked/banned by admin';



COMMENT ON COLUMN "public"."users"."blocked_at" IS 'Timestamp when user was blocked';



COMMENT ON COLUMN "public"."users"."blocked_reason" IS 'Reason for blocking (shown to user)';



COMMENT ON COLUMN "public"."users"."blocked_by" IS 'Admin user ID who performed the block';



CREATE OR REPLACE VIEW "public"."admin_failed_payments" WITH ("security_invoker"='on') AS
 SELECT "s"."id",
    "s"."creator_id",
    "u"."username" AS "creator_username",
    "u"."display_name" AS "creator_display_name",
    "s"."supporter_name",
    "s"."supporter_wallet_address",
    "s"."coffee_count",
    "s"."total_amount",
    "s"."tx_hash",
    "s"."chain_id",
    "s"."created_at",
    "s"."message"
   FROM ("public"."supports" "s"
     JOIN "public"."users" "u" ON (("s"."creator_id" = "u"."id")))
  WHERE (("s"."status" = 'failed'::"text") AND ("s"."created_at" >= ("now"() - '7 days'::interval)))
  ORDER BY "s"."created_at" DESC;


ALTER VIEW "public"."admin_failed_payments" OWNER TO "postgres";


COMMENT ON VIEW "public"."admin_failed_payments" IS 'Failed payment attempts in the last 7 days';



CREATE TABLE IF NOT EXISTS "public"."blacklisted_wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wallet_address" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "notes" "text",
    "blacklisted_by" "text" NOT NULL,
    "blacklisted_at" timestamp with time zone DEFAULT "now"(),
    "ban_scope" "text" DEFAULT 'full'::"text",
    CONSTRAINT "ban_scope_values" CHECK (("ban_scope" = ANY (ARRAY['full'::"text", 'support_only'::"text"])))
);


ALTER TABLE "public"."blacklisted_wallets" OWNER TO "postgres";


COMMENT ON TABLE "public"."blacklisted_wallets" IS 'Platform-wide wallet bans (managed by admin only)';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "related_support_id" "uuid",
    "metadata" "jsonb",
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_type_values" CHECK (("type" = ANY (ARRAY['support'::"text", 'milestone'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Real-time notifications table (published to supabase_realtime)';



COMMENT ON COLUMN "public"."notifications"."metadata" IS 'Flexible JSONB field for type-specific notification data';



CREATE TABLE IF NOT EXISTS "public"."supporter_wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "wallet_address" "text" NOT NULL,
    "used_names" "jsonb" DEFAULT '[]'::"jsonb",
    "total_support_count" integer DEFAULT 0,
    "total_creators_supported" integer DEFAULT 0,
    "first_seen_at" timestamp with time zone DEFAULT "now"(),
    "last_seen_at" timestamp with time zone DEFAULT "now"(),
    "is_blacklisted" boolean DEFAULT false,
    "blacklist_reason" "text",
    "blacklisted_at" timestamp with time zone,
    "blacklisted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."supporter_wallets" OWNER TO "postgres";


COMMENT ON TABLE "public"."supporter_wallets" IS 'Wallet tracking for admin monitoring (fraud detection, blacklist)';



COMMENT ON COLUMN "public"."supporter_wallets"."used_names" IS 'JSONB array of all names this wallet has used';



CREATE OR REPLACE VIEW "public"."admin_platform_stats" WITH ("security_invoker"='on') AS
 SELECT ( SELECT "count"(*) AS "count"
           FROM "public"."users"
          WHERE ("users"."is_active" = true)) AS "total_active_creators",
    ( SELECT "count"(*) AS "count"
           FROM "public"."users"
          WHERE ("users"."is_active" = false)) AS "total_inactive_creators",
    ( SELECT "count"(*) AS "count"
           FROM "public"."users"
          WHERE ("users"."created_at" >= ("now"() - '7 days'::interval))) AS "new_creators_last_7_days",
    ( SELECT "count"(*) AS "count"
           FROM "public"."users"
          WHERE ("users"."created_at" >= ("now"() - '30 days'::interval))) AS "new_creators_last_30_days",
    ( SELECT "count"(*) AS "count"
           FROM "public"."supports"
          WHERE ("supports"."status" = 'confirmed'::"text")) AS "total_confirmed_supports",
    ( SELECT "count"(*) AS "count"
           FROM "public"."supports"
          WHERE ("supports"."status" = 'pending'::"text")) AS "total_pending_supports",
    ( SELECT "count"(*) AS "count"
           FROM "public"."supports"
          WHERE ("supports"."status" = 'failed'::"text")) AS "total_failed_supports",
    ( SELECT COALESCE("sum"("supports"."total_amount"), (0)::numeric) AS "coalesce"
           FROM "public"."supports"
          WHERE ("supports"."status" = 'confirmed'::"text")) AS "total_platform_volume_usd",
    ( SELECT "count"(DISTINCT "supports"."supporter_wallet_address") AS "count"
           FROM "public"."supports"
          WHERE ("supports"."status" = 'confirmed'::"text")) AS "total_unique_supporters",
    ( SELECT "count"(*) AS "count"
           FROM "public"."supports"
          WHERE (("supports"."created_at" >= ("now"() - '24:00:00'::interval)) AND ("supports"."status" = 'confirmed'::"text"))) AS "supports_last_24h",
    ( SELECT COALESCE("sum"("supports"."total_amount"), (0)::numeric) AS "coalesce"
           FROM "public"."supports"
          WHERE (("supports"."created_at" >= ("now"() - '24:00:00'::interval)) AND ("supports"."status" = 'confirmed'::"text"))) AS "volume_last_24h",
    ( SELECT "count"(*) AS "count"
           FROM "public"."users"
          WHERE ("users"."created_at" >= ("now"() - '24:00:00'::interval))) AS "signups_last_24h",
    ( SELECT "count"(*) AS "count"
           FROM "public"."blacklisted_wallets") AS "total_blacklisted_wallets",
    ( SELECT "count"(*) AS "count"
           FROM "public"."supporter_wallets"
          WHERE ("supporter_wallets"."is_blacklisted" = true)) AS "total_flagged_wallets",
    ( SELECT "count"(*) AS "count"
           FROM "public"."notifications"
          WHERE ("notifications"."created_at" >= ("now"() - '24:00:00'::interval))) AS "notifications_sent_24h",
    ( SELECT "count"(*) AS "count"
           FROM "public"."notifications"
          WHERE ("notifications"."read" = false)) AS "total_unread_notifications";


ALTER VIEW "public"."admin_platform_stats" OWNER TO "postgres";


COMMENT ON VIEW "public"."admin_platform_stats" IS 'Real-time platform statistics for admin dashboard overview';



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_type" "text" NOT NULL,
    "actor_type" "text" NOT NULL,
    "actor_id" "text",
    "target_type" "text",
    "target_id" "text",
    "changes" "jsonb",
    "metadata" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "device_type" character varying(20),
    "device_brand" character varying(100),
    "device_model" character varying(100),
    "browser_name" character varying(50),
    "browser_version" character varying(20),
    "os_name" character varying(50),
    "os_version" character varying(20),
    "geo_city" character varying(100),
    "geo_country" character varying(100),
    "geo_country_code" character varying(10),
    "geo_region" character varying(100),
    "geo_latitude" numeric(9,6),
    "geo_longitude" numeric(9,6),
    "geo_flag" character varying(10),
    "session_id" character varying(100),
    CONSTRAINT "actor_type_values" CHECK (("actor_type" = ANY (ARRAY['user'::"text", 'admin'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_logs" IS 'Complete audit trail for all platform activities';



COMMENT ON COLUMN "public"."audit_logs"."user_agent" IS 'Full User-Agent header string';



COMMENT ON COLUMN "public"."audit_logs"."device_type" IS 'Device type: mobile, tablet, desktop, console, wearable, embedded';



COMMENT ON COLUMN "public"."audit_logs"."device_brand" IS 'Device manufacturer: Apple, Samsung, Google, etc.';



COMMENT ON COLUMN "public"."audit_logs"."device_model" IS 'Device model: iPhone, Galaxy S21, etc.';



COMMENT ON COLUMN "public"."audit_logs"."browser_name" IS 'Browser name: Chrome, Safari, Firefox, etc.';



COMMENT ON COLUMN "public"."audit_logs"."browser_version" IS 'Browser version number';



COMMENT ON COLUMN "public"."audit_logs"."os_name" IS 'Operating system: iOS, Android, Windows, macOS, Linux';



COMMENT ON COLUMN "public"."audit_logs"."os_version" IS 'OS version number';



COMMENT ON COLUMN "public"."audit_logs"."geo_city" IS 'City detected from IP (Vercel geolocation)';



COMMENT ON COLUMN "public"."audit_logs"."geo_country" IS 'Country detected from IP';



COMMENT ON COLUMN "public"."audit_logs"."geo_country_code" IS 'ISO country code (e.g., US, TR, GB)';



COMMENT ON COLUMN "public"."audit_logs"."geo_region" IS 'Vercel edge region that handled request';



COMMENT ON COLUMN "public"."audit_logs"."geo_latitude" IS 'Approximate latitude';



COMMENT ON COLUMN "public"."audit_logs"."geo_longitude" IS 'Approximate longitude';



COMMENT ON COLUMN "public"."audit_logs"."geo_flag" IS 'Country flag emoji';



COMMENT ON COLUMN "public"."audit_logs"."session_id" IS 'User session identifier for tracking multi-request flows';



CREATE OR REPLACE VIEW "public"."admin_recent_activity" WITH ("security_invoker"='true') AS
 SELECT "al"."id",
    "al"."event_type",
    "al"."actor_type",
    "al"."actor_id",
    "al"."target_type",
    "al"."target_id",
    "al"."changes",
    "al"."metadata",
    "al"."ip_address",
    "al"."user_agent",
    "al"."device_type",
    "al"."device_brand",
    "al"."device_model",
    "al"."browser_name",
    "al"."browser_version",
    "al"."os_name",
    "al"."os_version",
    "al"."geo_city",
    "al"."geo_country",
    "al"."geo_country_code",
    "al"."geo_region",
    "al"."geo_latitude",
    "al"."geo_longitude",
    "al"."geo_flag",
    "al"."session_id",
    "al"."created_at",
    "u"."username" AS "actor_username",
    "u"."display_name" AS "actor_display_name"
   FROM ("public"."audit_logs" "al"
     LEFT JOIN "public"."users" "u" ON ((("al"."actor_id")::"uuid" = "u"."id")))
  ORDER BY "al"."created_at" DESC
 LIMIT 100;


ALTER VIEW "public"."admin_recent_activity" OWNER TO "postgres";


COMMENT ON VIEW "public"."admin_recent_activity" IS 'Last 100 audit log entries (admin-only via RLS on audit_logs)';



CREATE OR REPLACE VIEW "public"."admin_suspicious_wallets" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "wallet_address",
    NULL::"jsonb" AS "used_names",
    NULL::integer AS "name_variation_count",
    NULL::integer AS "total_support_count",
    NULL::integer AS "total_creators_supported",
    NULL::timestamp with time zone AS "first_seen_at",
    NULL::timestamp with time zone AS "last_seen_at",
    NULL::boolean AS "is_blacklisted",
    NULL::"text" AS "blacklist_reason",
    NULL::bigint AS "supports_last_7_days",
    NULL::numeric AS "volume_last_7_days",
    NULL::bigint AS "creators_last_7_days",
    NULL::integer AS "fraud_risk_score";


ALTER VIEW "public"."admin_suspicious_wallets" OWNER TO "postgres";


COMMENT ON VIEW "public"."admin_suspicious_wallets" IS 'Potentially fraudulent wallets based on activity patterns';



CREATE OR REPLACE VIEW "public"."admin_top_creators" WITH ("security_invoker"='true') AS
 SELECT "u"."id",
    "u"."username",
    "u"."display_name",
    "u"."email",
    "u"."wallet_address",
    "u"."coffee_price",
    "u"."is_active",
    "u"."is_blocked",
    "u"."blocked_at",
    "u"."blocked_reason",
    "u"."created_at",
    COALESCE("stats"."total_supports", (0)::bigint) AS "total_supports",
    COALESCE("stats"."total_supporters", (0)::bigint) AS "total_supporters",
    COALESCE("stats"."total_earnings", (0)::numeric) AS "total_earnings",
    COALESCE("stats_30d"."supports_last_30_days", (0)::bigint) AS "supports_last_30_days",
    COALESCE("stats_30d"."earnings_last_30_days", (0)::numeric) AS "earnings_last_30_days",
    "stats"."last_support_at"
   FROM (("public"."users" "u"
     LEFT JOIN ( SELECT "supports"."creator_id",
            "count"(*) AS "total_supports",
            "count"(DISTINCT "supports"."supporter_wallet_address") AS "total_supporters",
            "sum"("supports"."total_amount") AS "total_earnings",
            "max"("supports"."created_at") AS "last_support_at"
           FROM "public"."supports"
          WHERE ("supports"."status" = 'confirmed'::"text")
          GROUP BY "supports"."creator_id") "stats" ON (("u"."id" = "stats"."creator_id")))
     LEFT JOIN ( SELECT "supports"."creator_id",
            "count"(*) AS "supports_last_30_days",
            "sum"("supports"."total_amount") AS "earnings_last_30_days"
           FROM "public"."supports"
          WHERE (("supports"."status" = 'confirmed'::"text") AND ("supports"."created_at" >= ("now"() - '30 days'::interval)))
          GROUP BY "supports"."creator_id") "stats_30d" ON (("u"."id" = "stats_30d"."creator_id")))
  ORDER BY "stats"."total_earnings" DESC NULLS LAST;


ALTER VIEW "public"."admin_top_creators" OWNER TO "postgres";


COMMENT ON VIEW "public"."admin_top_creators" IS 'Creators ranked by earnings (admin-only via RLS on users)';



CREATE TABLE IF NOT EXISTS "public"."admin_wallets" (
    "wallet_address" "text" NOT NULL,
    "added_by" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."admin_wallets" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_wallets" IS 'Stores admin wallet addresses for RLS policy checks';



CREATE OR REPLACE VIEW "public"."creator_dashboard_stats" WITH ("security_invoker"='on') AS
 SELECT "u"."id",
    "u"."username",
    "u"."display_name",
    "count"("s"."id") FILTER (WHERE ("s"."status" = 'confirmed'::"text")) AS "total_supports",
    "count"(DISTINCT "s"."supporter_wallet_address") FILTER (WHERE ("s"."status" = 'confirmed'::"text")) AS "total_supporters",
    COALESCE("sum"("s"."total_amount") FILTER (WHERE ("s"."status" = 'confirmed'::"text")), (0)::numeric) AS "total_earnings",
    "count"("s"."id") FILTER (WHERE (("s"."status" = 'confirmed'::"text") AND ("s"."created_at" >= "date_trunc"('month'::"text", "now"())))) AS "monthly_supports",
    COALESCE("sum"("s"."total_amount") FILTER (WHERE (("s"."status" = 'confirmed'::"text") AND ("s"."created_at" >= "date_trunc"('month'::"text", "now"())))), (0)::numeric) AS "monthly_earnings"
   FROM ("public"."users" "u"
     LEFT JOIN "public"."supports" "s" ON (("u"."id" = "s"."creator_id")))
  WHERE ("u"."is_active" = true)
  GROUP BY "u"."id", "u"."username", "u"."display_name";


ALTER VIEW "public"."creator_dashboard_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_verification_tokens" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "token_type" "text" NOT NULL,
    "used" boolean DEFAULT false,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "token_type_values" CHECK (("token_type" = ANY (ARRAY['signup'::"text", 'login'::"text", 'change_email'::"text"])))
);


ALTER TABLE "public"."email_verification_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_verification_tokens" IS 'OTP tokens for email verification (signup, login, change)';



CREATE TABLE IF NOT EXISTS "public"."email_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "otp_code" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."email_verifications" IS 'Stores email verification OTP codes with expiry';



COMMENT ON COLUMN "public"."email_verifications"."otp_code" IS 'Hashed OTP code for security';



COMMENT ON COLUMN "public"."email_verifications"."expires_at" IS 'OTP expiry timestamp (typically 10 minutes)';



COMMENT ON COLUMN "public"."email_verifications"."verified" IS 'Whether the OTP has been used';



CREATE OR REPLACE VIEW "public"."public_creator_profiles" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"text" AS "wallet_address",
    NULL::"text" AS "username",
    NULL::"text" AS "display_name",
    NULL::"text" AS "bio",
    NULL::"text" AS "avatar_url",
    NULL::"text" AS "cover_image_url",
    NULL::"text" AS "twitter_handle",
    NULL::"text" AS "instagram_handle",
    NULL::"text" AS "github_handle",
    NULL::"text" AS "tiktok_handle",
    NULL::"text" AS "opensea_handle",
    NULL::numeric(10,2) AS "coffee_price",
    NULL::timestamp with time zone AS "created_at",
    NULL::bigint AS "supporter_count";


ALTER VIEW "public"."public_creator_profiles" OWNER TO "postgres";


COMMENT ON VIEW "public"."public_creator_profiles" IS 'Public creator profiles with supporter count. Used for discover page to prevent N+1 queries. Email and private settings excluded for security. Uses SECURITY INVOKER to enforce RLS.';



ALTER TABLE ONLY "public"."admin_wallets"
    ADD CONSTRAINT "admin_wallets_pkey" PRIMARY KEY ("wallet_address");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blacklisted_wallets"
    ADD CONSTRAINT "blacklisted_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blacklisted_wallets"
    ADD CONSTRAINT "blacklisted_wallets_wallet_address_key" UNIQUE ("wallet_address");



ALTER TABLE ONLY "public"."email_verification_tokens"
    ADD CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_verifications"
    ADD CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supporter_wallets"
    ADD CONSTRAINT "supporter_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supporter_wallets"
    ADD CONSTRAINT "supporter_wallets_wallet_address_key" UNIQUE ("wallet_address");



ALTER TABLE ONLY "public"."supports"
    ADD CONSTRAINT "supports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supports"
    ADD CONSTRAINT "supports_tx_hash_key" UNIQUE ("tx_hash");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_wallet_address_key" UNIQUE ("wallet_address");



CREATE INDEX "idx_admin_wallets_address" ON "public"."admin_wallets" USING "btree" ("wallet_address");



CREATE INDEX "idx_audit_logs_actor" ON "public"."audit_logs" USING "btree" ("actor_type", "actor_id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_created_at_desc" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_logs_device_type" ON "public"."audit_logs" USING "btree" ("device_type") WHERE ("device_type" IS NOT NULL);



CREATE INDEX "idx_audit_logs_event_type" ON "public"."audit_logs" USING "btree" ("event_type");



CREATE INDEX "idx_audit_logs_geo_country" ON "public"."audit_logs" USING "btree" ("geo_country") WHERE ("geo_country" IS NOT NULL);



CREATE INDEX "idx_audit_logs_session_id" ON "public"."audit_logs" USING "btree" ("session_id") WHERE ("session_id" IS NOT NULL);



CREATE INDEX "idx_audit_logs_target" ON "public"."audit_logs" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_blacklisted_wallets_address" ON "public"."blacklisted_wallets" USING "btree" ("wallet_address");



CREATE INDEX "idx_email_tokens_email" ON "public"."email_verification_tokens" USING "btree" ("email");



CREATE INDEX "idx_email_tokens_expires" ON "public"."email_verification_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_email_tokens_token" ON "public"."email_verification_tokens" USING "btree" ("token");



CREATE INDEX "idx_email_verifications_email" ON "public"."email_verifications" USING "btree" ("email");



CREATE INDEX "idx_email_verifications_expires_at" ON "public"."email_verifications" USING "btree" ("expires_at");



CREATE INDEX "idx_email_verifications_user_id" ON "public"."email_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_related_support" ON "public"."notifications" USING "btree" ("related_support_id");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_user_read" ON "public"."notifications" USING "btree" ("user_id", "read");



CREATE INDEX "idx_notifications_user_unread_created" ON "public"."notifications" USING "btree" ("user_id", "read", "created_at" DESC);



CREATE INDEX "idx_supporter_wallets_address" ON "public"."supporter_wallets" USING "btree" ("wallet_address");



CREATE INDEX "idx_supporter_wallets_blacklisted" ON "public"."supporter_wallets" USING "btree" ("is_blacklisted");



CREATE INDEX "idx_supports_created_at" ON "public"."supports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_supports_creator_created" ON "public"."supports" USING "btree" ("creator_id", "created_at" DESC);



CREATE INDEX "idx_supports_creator_id" ON "public"."supports" USING "btree" ("creator_id");



CREATE INDEX "idx_supports_creator_status" ON "public"."supports" USING "btree" ("creator_id", "status");



CREATE INDEX "idx_supports_creator_wallet" ON "public"."supports" USING "btree" ("creator_id", "supporter_wallet_address") WHERE ("status" = 'confirmed'::"text");



CREATE INDEX "idx_supports_is_hidden" ON "public"."supports" USING "btree" ("is_hidden_by_creator");



CREATE INDEX "idx_supports_is_private" ON "public"."supports" USING "btree" ("is_message_private");



CREATE INDEX "idx_supports_status" ON "public"."supports" USING "btree" ("status");



CREATE INDEX "idx_supports_supporter_wallet" ON "public"."supports" USING "btree" ("supporter_wallet_address");



CREATE INDEX "idx_supports_tx_hash" ON "public"."supports" USING "btree" ("tx_hash");



CREATE INDEX "idx_supports_wallet_status" ON "public"."supports" USING "btree" ("supporter_wallet_address", "status");



CREATE INDEX "idx_users_active_created" ON "public"."users" USING "btree" ("is_active", "created_at" DESC) WHERE ("is_active" = true);



CREATE INDEX "idx_users_blocked_by" ON "public"."users" USING "btree" ("blocked_by") WHERE ("blocked_by" IS NOT NULL);



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_is_blocked" ON "public"."users" USING "btree" ("is_blocked") WHERE ("is_blocked" = true);



CREATE INDEX "idx_users_username" ON "public"."users" USING "btree" ("username");



CREATE INDEX "idx_users_wallet_address" ON "public"."users" USING "btree" ("wallet_address");



CREATE OR REPLACE VIEW "public"."admin_suspicious_wallets" WITH ("security_invoker"='on') AS
 SELECT "sw"."id",
    "sw"."wallet_address",
    "sw"."used_names",
    "jsonb_array_length"("sw"."used_names") AS "name_variation_count",
    "sw"."total_support_count",
    "sw"."total_creators_supported",
    "sw"."first_seen_at",
    "sw"."last_seen_at",
    "sw"."is_blacklisted",
    "sw"."blacklist_reason",
    "count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) AS "supports_last_7_days",
    COALESCE("sum"("s"."total_amount") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))), (0)::numeric) AS "volume_last_7_days",
    "count"(DISTINCT "s"."creator_id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) AS "creators_last_7_days",
    ((
        CASE
            WHEN ("jsonb_array_length"("sw"."used_names") > 10) THEN 3
            WHEN ("jsonb_array_length"("sw"."used_names") > 5) THEN 2
            WHEN ("jsonb_array_length"("sw"."used_names") > 3) THEN 1
            ELSE 0
        END +
        CASE
            WHEN ("count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) > 50) THEN 3
            WHEN ("count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) > 25) THEN 2
            WHEN ("count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) > 10) THEN 1
            ELSE 0
        END) +
        CASE
            WHEN ("sw"."total_support_count" > 200) THEN 2
            WHEN ("sw"."total_support_count" > 100) THEN 1
            ELSE 0
        END) AS "fraud_risk_score"
   FROM ("public"."supporter_wallets" "sw"
     LEFT JOIN "public"."supports" "s" ON ((("sw"."wallet_address" = "s"."supporter_wallet_address") AND ("s"."status" = 'confirmed'::"text"))))
  WHERE ("sw"."is_blacklisted" = false)
  GROUP BY "sw"."id"
 HAVING (("jsonb_array_length"("sw"."used_names") > 3) OR ("count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) > 10) OR ("sw"."total_support_count" > 100))
  ORDER BY ((
        CASE
            WHEN ("jsonb_array_length"("sw"."used_names") > 10) THEN 3
            WHEN ("jsonb_array_length"("sw"."used_names") > 5) THEN 2
            WHEN ("jsonb_array_length"("sw"."used_names") > 3) THEN 1
            ELSE 0
        END +
        CASE
            WHEN ("count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) > 50) THEN 3
            WHEN ("count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) > 25) THEN 2
            WHEN ("count"("s"."id") FILTER (WHERE ("s"."created_at" >= ("now"() - '7 days'::interval))) > 10) THEN 1
            ELSE 0
        END) +
        CASE
            WHEN ("sw"."total_support_count" > 200) THEN 2
            WHEN ("sw"."total_support_count" > 100) THEN 1
            ELSE 0
        END) DESC, "sw"."last_seen_at" DESC;



CREATE OR REPLACE VIEW "public"."public_creator_profiles" WITH ("security_invoker"='on') AS
 SELECT "u"."id",
    "u"."wallet_address",
    "u"."username",
    "u"."display_name",
    "u"."bio",
    "u"."avatar_url",
    "u"."cover_image_url",
    "u"."twitter_handle",
    "u"."instagram_handle",
    "u"."github_handle",
    "u"."tiktok_handle",
    "u"."opensea_handle",
    "u"."coffee_price",
    "u"."created_at",
    "count"(DISTINCT "s"."supporter_wallet_address") FILTER (WHERE ("s"."status" = 'confirmed'::"text")) AS "supporter_count"
   FROM ("public"."users" "u"
     LEFT JOIN "public"."supports" "s" ON (("u"."id" = "s"."creator_id")))
  WHERE ("u"."is_active" = true)
  GROUP BY "u"."id";



CREATE OR REPLACE TRIGGER "check_milestones_on_support_confirmed" AFTER INSERT OR UPDATE OF "status" ON "public"."supports" FOR EACH ROW WHEN (("new"."status" = 'confirmed'::"text")) EXECUTE FUNCTION "public"."check_and_notify_milestones"();



CREATE OR REPLACE TRIGGER "cleanup_old_avatar" BEFORE UPDATE OF "avatar_url" ON "public"."users" FOR EACH ROW WHEN (("old"."avatar_url" IS DISTINCT FROM "new"."avatar_url")) EXECUTE FUNCTION "public"."delete_old_avatar"();



CREATE OR REPLACE TRIGGER "cleanup_old_cover" BEFORE UPDATE OF "cover_image_url" ON "public"."users" FOR EACH ROW WHEN (("old"."cover_image_url" IS DISTINCT FROM "new"."cover_image_url")) EXECUTE FUNCTION "public"."delete_old_cover"();



CREATE OR REPLACE TRIGGER "cleanup_user_files_on_delete" BEFORE DELETE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_user_files"();



CREATE OR REPLACE TRIGGER "notify_creator_on_support_confirmed" AFTER INSERT OR UPDATE OF "status" ON "public"."supports" FOR EACH ROW WHEN (("new"."status" = 'confirmed'::"text")) EXECUTE FUNCTION "public"."notify_creator_on_support"();



CREATE OR REPLACE TRIGGER "track_supporter_on_support_confirmed" AFTER INSERT OR UPDATE OF "status" ON "public"."supports" FOR EACH ROW WHEN (("new"."status" = 'confirmed'::"text")) EXECUTE FUNCTION "public"."track_supporter_wallet"();



CREATE OR REPLACE TRIGGER "trigger_log_user_signup" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."log_user_signup"();



CREATE OR REPLACE TRIGGER "update_supporter_wallets_updated_at" BEFORE UPDATE ON "public"."supporter_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_wallets"
    ADD CONSTRAINT "admin_wallets_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."email_verifications"
    ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_support_id_fkey" FOREIGN KEY ("related_support_id") REFERENCES "public"."supports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supports"
    ADD CONSTRAINT "supports_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Active creator profiles are public" ON "public"."users" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Admin only can SELECT audit logs" ON "public"."audit_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Admins can view all users" ON "public"."users" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"());



CREATE POLICY "Allow INSERT for authenticated and anon" ON "public"."audit_logs" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can create support via RPC" ON "public"."supports" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view admin wallets" ON "public"."admin_wallets" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Confirmed public supports are viewable" ON "public"."supports" FOR SELECT USING ((("status" = 'confirmed'::"text") AND ("is_message_private" = false) AND ("is_hidden_by_creator" = false)));



CREATE POLICY "Creators can delete their supports" ON "public"."supports" FOR DELETE USING (("creator_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Creators can moderate their supports" ON "public"."supports" FOR UPDATE USING (("creator_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "Creators can view all their supports" ON "public"."supports" FOR SELECT USING (("creator_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "No DELETE allowed" ON "public"."audit_logs" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "No UPDATE allowed" ON "public"."audit_logs" FOR UPDATE TO "authenticated" USING (false);



CREATE POLICY "No public access to audit logs" ON "public"."audit_logs" USING (false);



CREATE POLICY "No public access to blacklist" ON "public"."blacklisted_wallets" USING (false);



CREATE POLICY "No public access to supporter wallets" ON "public"."supporter_wallets" USING (false);



CREATE POLICY "Only admins can modify admin wallets" ON "public"."admin_wallets" TO "authenticated" USING ("public"."is_admin_user"()) WITH CHECK ("public"."is_admin_user"());



CREATE POLICY "Service role full access" ON "public"."audit_logs" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role full access to admin wallets" ON "public"."admin_wallets" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "System can create email tokens" ON "public"."email_verification_tokens" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can update email tokens" ON "public"."email_verification_tokens" FOR UPDATE USING (true);



CREATE POLICY "Users can create own verification records" ON "public"."email_verifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create their own profile" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own verification records" ON "public"."email_verifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own notifications" ON "public"."notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own profile" ON "public"."users" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own verification records" ON "public"."email_verifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own data" ON "public"."users" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view own verification records" ON "public"."email_verifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own email tokens" ON "public"."email_verification_tokens" FOR SELECT USING (("email" = "current_setting"('request.jwt.claim.email'::"text", true)));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."admin_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blacklisted_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_verification_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supporter_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."supports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_admin_wallet"("p_wallet_address" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_admin_wallet"("p_wallet_address" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_admin_wallet"("p_wallet_address" "text", "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_blacklist_wallet"("p_wallet_address" "text", "p_reason" "text", "p_notes" "text", "p_admin_wallet" "text", "p_ban_scope" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_blacklist_wallet"("p_wallet_address" "text", "p_reason" "text", "p_notes" "text", "p_admin_wallet" "text", "p_ban_scope" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_blacklist_wallet"("p_wallet_address" "text", "p_reason" "text", "p_notes" "text", "p_admin_wallet" "text", "p_ban_scope" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_blacklist_wallet"("p_wallet_address" "text", "p_reason" "text", "p_notes" "text", "p_admin_wallet" "text", "p_ban_scope" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_block_user"("p_user_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_block_user"("p_user_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_block_user"("p_user_id" "uuid", "p_admin_id" "uuid", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_get_analytics"("p_days" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_get_analytics"("p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_get_analytics"("p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_get_analytics"("p_days" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_search_users"("p_search_term" "text", "p_limit" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_search_users"("p_search_term" "text", "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_search_users"("p_search_term" "text", "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_search_users"("p_search_term" "text", "p_limit" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_unblacklist_wallet"("p_wallet_address" "text", "p_admin_wallet" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_unblacklist_wallet"("p_wallet_address" "text", "p_admin_wallet" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_unblacklist_wallet"("p_wallet_address" "text", "p_admin_wallet" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_unblacklist_wallet"("p_wallet_address" "text", "p_admin_wallet" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_unblock_user"("p_user_id" "uuid", "p_admin_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_unblock_user"("p_user_id" "uuid", "p_admin_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_unblock_user"("p_user_id" "uuid", "p_admin_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_and_notify_milestones"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_and_notify_milestones"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_and_notify_milestones"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_otps"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_otps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_otps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_user_files"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_user_files"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_user_files"() TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_all_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."clear_all_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_all_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_audit_log"("p_event_type" "text", "p_actor_type" "text", "p_actor_id" "text", "p_target_type" "text", "p_target_id" "text", "p_changes" "jsonb", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_audit_log"("p_event_type" "text", "p_actor_type" "text", "p_actor_id" "text", "p_target_type" "text", "p_target_id" "text", "p_changes" "jsonb", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_audit_log"("p_event_type" "text", "p_actor_type" "text", "p_actor_id" "text", "p_target_type" "text", "p_target_id" "text", "p_changes" "jsonb", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_related_support_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_related_support_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_related_support_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_support"("p_creator_username" "text", "p_supporter_name" "text", "p_supporter_wallet" "text", "p_coffee_count" integer, "p_message" "text", "p_tx_hash" "text", "p_chain_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_support"("p_creator_username" "text", "p_supporter_name" "text", "p_supporter_wallet" "text", "p_coffee_count" integer, "p_message" "text", "p_tx_hash" "text", "p_chain_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_support"("p_creator_username" "text", "p_supporter_name" "text", "p_supporter_wallet" "text", "p_coffee_count" integer, "p_message" "text", "p_tx_hash" "text", "p_chain_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_notification"("p_notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_notification"("p_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_notification"("p_notification_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_avatar"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_old_cover"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_old_cover"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_old_cover"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notification_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notification_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_wallet_blacklisted"("p_wallet_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_wallet_blacklisted"("p_wallet_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_wallet_blacklisted"("p_wallet_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_login"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_login"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_login"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_logout"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_logout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_logout"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_signup"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_signup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_signup"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_notification_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_creator_on_support"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_creator_on_support"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_creator_on_support"() TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_admin_wallet"("p_wallet_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_admin_wallet"("p_wallet_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_admin_wallet"("p_wallet_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."track_supporter_wallet"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_supporter_wallet"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_supporter_wallet"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."supports" TO "anon";
GRANT ALL ON TABLE "public"."supports" TO "authenticated";
GRANT ALL ON TABLE "public"."supports" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."admin_failed_payments" TO "anon";
GRANT ALL ON TABLE "public"."admin_failed_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_failed_payments" TO "service_role";



GRANT ALL ON TABLE "public"."blacklisted_wallets" TO "anon";
GRANT ALL ON TABLE "public"."blacklisted_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."blacklisted_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."supporter_wallets" TO "anon";
GRANT ALL ON TABLE "public"."supporter_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."supporter_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."admin_platform_stats" TO "anon";
GRANT ALL ON TABLE "public"."admin_platform_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_platform_stats" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_recent_activity" TO "anon";
GRANT ALL ON TABLE "public"."admin_recent_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_recent_activity" TO "service_role";



GRANT ALL ON TABLE "public"."admin_suspicious_wallets" TO "anon";
GRANT ALL ON TABLE "public"."admin_suspicious_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_suspicious_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."admin_top_creators" TO "anon";
GRANT ALL ON TABLE "public"."admin_top_creators" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_top_creators" TO "service_role";



GRANT ALL ON TABLE "public"."admin_wallets" TO "anon";
GRANT ALL ON TABLE "public"."admin_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."creator_dashboard_stats" TO "anon";
GRANT ALL ON TABLE "public"."creator_dashboard_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."creator_dashboard_stats" TO "service_role";



GRANT ALL ON TABLE "public"."email_verification_tokens" TO "anon";
GRANT ALL ON TABLE "public"."email_verification_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."email_verification_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."email_verifications" TO "anon";
GRANT ALL ON TABLE "public"."email_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."email_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."public_creator_profiles" TO "anon";
GRANT ALL ON TABLE "public"."public_creator_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_creator_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
