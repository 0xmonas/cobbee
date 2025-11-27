-- Migration: Enable RLS on audit_logs table
-- Security: Audit logs should only be readable by admins, writable only by service role

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role to INSERT audit logs (server-side API only)
-- Service role bypasses RLS by default, but we create policy for clarity
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy 2: Allow service role to SELECT all audit logs
CREATE POLICY "Service role can read all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO service_role
  USING (true);

-- Policy 3: Admin users can SELECT audit logs (for admin dashboard)
-- Note: This policy will be created later when users table exists
-- For now, only service role can access audit logs
-- TODO: Add admin policy after users table migration:
--   CREATE POLICY "Admins can read audit logs" ON public.audit_logs
--     FOR SELECT TO authenticated
--     USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Policy 4: Block all other operations (UPDATE, DELETE)
-- Audit logs should be immutable - no updates or deletes allowed
-- Exception: Service role can still modify via direct SQL if needed

-- No UPDATE policy = blocked by default
-- No DELETE policy = blocked by default

COMMENT ON POLICY "Service role can insert audit logs" ON public.audit_logs IS
  'Allow server-side API (service role) to create audit log entries';

COMMENT ON POLICY "Service role can read all audit logs" ON public.audit_logs IS
  'Allow server-side API (service role) to read all audit logs for analytics';
