-- Create email_verifications table for OTP codes
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- Enable Row Level Security
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own verification records
CREATE POLICY "Users can view own verification records"
  ON public.email_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification records
CREATE POLICY "Users can create own verification records"
  ON public.email_verifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification records
CREATE POLICY "Users can update own verification records"
  ON public.email_verifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own verification records
CREATE POLICY "Users can delete own verification records"
  ON public.email_verifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up expired OTP codes (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.email_verifications
  WHERE expires_at < NOW() AND verified = FALSE;
END;
$$;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps() TO authenticated;

-- Optional: Create a cron job to run cleanup daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-otps', '0 0 * * *', 'SELECT public.cleanup_expired_otps()');

COMMENT ON TABLE public.email_verifications IS 'Stores email verification OTP codes with expiry';
COMMENT ON COLUMN public.email_verifications.otp_code IS 'Hashed OTP code for security';
COMMENT ON COLUMN public.email_verifications.expires_at IS 'OTP expiry timestamp (typically 10 minutes)';
COMMENT ON COLUMN public.email_verifications.verified IS 'Whether the OTP has been used';
