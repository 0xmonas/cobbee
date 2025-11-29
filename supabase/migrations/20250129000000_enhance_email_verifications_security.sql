-- ============================================================================
-- ENHANCED EMAIL VERIFICATION SECURITY (2025 Standards)
-- ============================================================================
-- Compliance: OWASP ASVS, NIST SP 800-63B, RFC 9106
-- Features:
--   1. Attempt tracking (prevent brute force)
--   2. Lockout mechanism (OWASP requirement)
--   3. Audit logging (compliance requirement)
--   4. IP tracking (security monitoring)
-- ============================================================================

-- Add security columns to email_verifications table
ALTER TABLE public.email_verifications
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_email_verifications_locked_until
  ON public.email_verifications(locked_until);

-- Update comment
COMMENT ON COLUMN public.email_verifications.attempt_count IS
  'Number of failed verification attempts (max 5 per OWASP)';
COMMENT ON COLUMN public.email_verifications.locked_until IS
  'Lockout timestamp after max failed attempts (NIST SP 800-63B)';
COMMENT ON COLUMN public.email_verifications.ip_address IS
  'IP address for audit trail (security monitoring)';
COMMENT ON COLUMN public.email_verifications.user_agent IS
  'User agent for fraud detection';
COMMENT ON COLUMN public.email_verifications.last_attempt_at IS
  'Last verification attempt timestamp';

-- Function to check if OTP is locked (brute force protection)
CREATE OR REPLACE FUNCTION public.is_otp_locked(
  p_user_id UUID,
  p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_locked_until TIMESTAMPTZ;
BEGIN
  -- Get locked_until timestamp
  SELECT locked_until INTO v_locked_until
  FROM public.email_verifications
  WHERE user_id = p_user_id
    AND email = p_email
    AND verified = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  -- If locked_until is in the future, OTP is locked
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Function to increment failed attempt counter
CREATE OR REPLACE FUNCTION public.increment_otp_attempt(
  p_user_id UUID,
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE(
  attempts INTEGER,
  locked BOOLEAN,
  locked_until_ts TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_attempt_count INTEGER;
  v_locked_until TIMESTAMPTZ := NULL;
  v_id UUID;
  v_max_attempts INTEGER := 5; -- OWASP recommendation: max 5 attempts
  v_lockout_minutes INTEGER := 15; -- NIST: 15-30 minutes lockout
BEGIN
  -- Get current record
  SELECT id, attempt_count INTO v_id, v_attempt_count
  FROM public.email_verifications
  WHERE user_id = p_user_id
    AND email = p_email
    AND verified = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_id IS NULL THEN
    -- No record found
    RETURN QUERY SELECT 0, FALSE, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Increment attempt count
  v_attempt_count := COALESCE(v_attempt_count, 0) + 1;

  -- Check if max attempts reached
  IF v_attempt_count >= v_max_attempts THEN
    v_locked_until := NOW() + (v_lockout_minutes || ' minutes')::INTERVAL;
  END IF;

  -- Update record
  UPDATE public.email_verifications
  SET
    attempt_count = v_attempt_count,
    locked_until = v_locked_until,
    last_attempt_at = NOW(),
    ip_address = COALESCE(p_ip_address, ip_address),
    user_agent = COALESCE(p_user_agent, user_agent)
  WHERE id = v_id;

  -- Return result
  RETURN QUERY SELECT
    v_attempt_count,
    (v_locked_until IS NOT NULL),
    v_locked_until;
END;
$$;

-- Function to reset attempts on successful verification
CREATE OR REPLACE FUNCTION public.reset_otp_attempts(
  p_user_id UUID,
  p_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.email_verifications
  SET
    attempt_count = 0,
    locked_until = NULL,
    verified = TRUE
  WHERE user_id = p_user_id
    AND email = p_email
    AND verified = FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_otp_locked(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_otp_attempt(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_otp_attempts(UUID, TEXT) TO authenticated;

-- Create audit log table for OTP attempts (compliance requirement)
CREATE TABLE IF NOT EXISTS public.otp_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'sent', 'verified', 'failed', 'locked'
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_otp_audit_logs_user_id
  ON public.otp_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_audit_logs_created_at
  ON public.otp_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_otp_audit_logs_action
  ON public.otp_audit_logs(action);

-- Enable RLS
ALTER TABLE public.otp_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own audit logs
CREATE POLICY "Users can view own OTP audit logs"
  ON public.otp_audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service can insert OTP audit logs"
  ON public.otp_audit_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.otp_audit_logs IS
  'Audit trail for OTP verification attempts (OWASP compliance)';

-- Function to log OTP events
CREATE OR REPLACE FUNCTION public.log_otp_event(
  p_user_id UUID,
  p_email TEXT,
  p_action TEXT,
  p_success BOOLEAN,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.otp_audit_logs (
    user_id,
    email,
    action,
    success,
    ip_address,
    user_agent,
    error_message
  ) VALUES (
    p_user_id,
    p_email,
    p_action,
    p_success,
    p_ip_address,
    p_user_agent,
    p_error_message
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_otp_event(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT)
  TO authenticated, service_role;

-- Update cleanup function to also remove old audit logs (GDPR compliance)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Delete expired and unverified OTPs
  DELETE FROM public.email_verifications
  WHERE expires_at < NOW() AND verified = FALSE;

  -- Delete OTP audit logs older than 90 days (GDPR: data minimization)
  DELETE FROM public.otp_audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
