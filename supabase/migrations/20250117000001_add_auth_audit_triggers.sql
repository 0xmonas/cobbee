-- =====================================================================
-- Migration: Add Auth Audit Triggers for Login/Signup Events
-- =====================================================================
-- Description:
--   1. Create trigger function to log user signup events
--   2. Create trigger function to log login events (via auth.sessions)
--   3. Automatically capture auth events to audit_logs
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Trigger Function: Log User Signup
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

COMMENT ON FUNCTION public.log_user_signup IS 'Trigger function to log user signup events to audit_logs';

-- Create trigger on users table INSERT
DROP TRIGGER IF EXISTS trigger_log_user_signup ON public.users;

CREATE TRIGGER trigger_log_user_signup
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_signup();

-- ---------------------------------------------------------------------
-- 2. Trigger Function: Log User Login (via auth.sessions)
-- ---------------------------------------------------------------------
-- Note: We track logins by monitoring new session creation in auth.sessions
-- This is more reliable than monitoring auth.users as logins don't modify that table

CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

COMMENT ON FUNCTION public.log_user_login IS 'Trigger function to log user login events via auth.sessions';

-- Create trigger on auth.sessions table INSERT
-- Note: This requires access to auth schema
DROP TRIGGER IF EXISTS trigger_log_user_login ON auth.sessions;

CREATE TRIGGER trigger_log_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_login();

-- ---------------------------------------------------------------------
-- 3. Trigger Function: Log User Logout (via auth.sessions DELETE)
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_user_logout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

COMMENT ON FUNCTION public.log_user_logout IS 'Trigger function to log user logout events';

DROP TRIGGER IF EXISTS trigger_log_user_logout ON auth.sessions;

CREATE TRIGGER trigger_log_user_logout
  AFTER DELETE ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_logout();

-- ---------------------------------------------------------------------
-- 4. Grant Permissions
-- ---------------------------------------------------------------------

-- Grant EXECUTE on trigger functions (needed for SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION public.log_user_signup() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_user_login() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_user_logout() TO postgres, authenticated, anon;

-- =====================================================================
-- End of Migration
-- =====================================================================
