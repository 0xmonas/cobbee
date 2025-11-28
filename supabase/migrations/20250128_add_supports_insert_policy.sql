-- Migration: Add INSERT policy for supports table (service role)
-- This allows the API (service role) to create support records for x402 payments
--
-- CONTEXT: Database already has "Anyone can create support via RPC" policy
-- which only works for stored procedures (RPC), not direct INSERT statements.
-- The x402 payment API uses direct INSERT, so we need a service_role policy.

-- ============================================================================
-- SUPPORTS TABLE: Add INSERT Policy for Service Role
-- ============================================================================

-- Policy: Allow service role (API) to insert support records directly
-- This is needed for x402 payment flow where anonymous users can support creators
CREATE POLICY "Service role can insert supports directly"
  ON public.supports
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON POLICY "Service role can insert supports directly" ON public.supports IS
  'Allow server-side API (service role) to create support records via direct INSERT for x402 payment processing. Complements the existing RPC-based insert policy.';
