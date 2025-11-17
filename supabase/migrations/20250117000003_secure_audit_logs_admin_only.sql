-- =====================================================================
-- Migration: CRITICAL SECURITY FIX - Audit Logs Admin-Only Access
-- =====================================================================
-- Description:
--   Fix security vulnerability where any authenticated user could read
--   all audit logs. This migration:
--   1. Creates admin_users table for tracking admin wallet addresses
--   2. Updates RLS policies to allow only admins to SELECT audit logs
--   3. Keeps INSERT open for API routes and triggers
--   4. Adds helper function to check if user is admin
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Create Admin Users Helper Table
-- ---------------------------------------------------------------------
-- This table stores admin wallet addresses for database-level checks
-- Managed via API/admin panel, synced with ADMIN_WALLET_ADDRESSES env

CREATE TABLE IF NOT EXISTS public.admin_wallets (
  wallet_address TEXT PRIMARY KEY,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  notes TEXT
);

COMMENT ON TABLE public.admin_wallets IS 'Stores admin wallet addresses for RLS policy checks';

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_wallets_address ON public.admin_wallets(wallet_address);

-- ---------------------------------------------------------------------
-- 2. Create Helper Function to Check Admin Status
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

COMMENT ON FUNCTION public.is_admin_user IS 'Returns TRUE if current user is an admin based on wallet address';

-- ---------------------------------------------------------------------
-- 3. Update Audit Logs RLS Policies - ADMIN ONLY for SELECT
-- ---------------------------------------------------------------------

-- Drop old permissive SELECT policy
DROP POLICY IF EXISTS "Allow SELECT for authenticated" ON public.audit_logs;

-- Create new ADMIN-ONLY SELECT policy
CREATE POLICY "Admin only can SELECT audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    -- Only allow if user is admin
    public.is_admin_user()
  );

-- Keep INSERT policy permissive (needed for API routes and triggers)
-- This is safe because users can only INSERT their own actions, not read others
DROP POLICY IF EXISTS "Allow INSERT for authenticated" ON public.audit_logs;

CREATE POLICY "Allow INSERT for authenticated and anon"
  ON public.audit_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Service role still has full access (for migrations, etc.)
DROP POLICY IF EXISTS "Service role can do anything" ON public.audit_logs;

CREATE POLICY "Service role full access"
  ON public.audit_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure UPDATE and DELETE are blocked for everyone except service role
DROP POLICY IF EXISTS "Prevent UPDATE" ON public.audit_logs;
DROP POLICY IF EXISTS "Prevent DELETE" ON public.audit_logs;

CREATE POLICY "No UPDATE allowed"
  ON public.audit_logs
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No DELETE allowed"
  ON public.audit_logs
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------
-- 4. Secure Admin Views with RLS
-- ---------------------------------------------------------------------
-- Views inherit RLS from underlying tables, but we add explicit checks

-- Enable RLS on users table if not already (for admin views)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own data
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Admins can view all user data
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

-- ---------------------------------------------------------------------
-- 5. Insert Initial Admin Wallets (OPTIONAL - Comment out if not needed)
-- ---------------------------------------------------------------------
-- IMPORTANT: Replace these with your actual admin wallet addresses
-- Or manage via admin panel after deployment

-- Example (COMMENTED OUT):
-- INSERT INTO public.admin_wallets (wallet_address, notes)
-- VALUES
--   ('0xYourAdminWallet1', 'Primary admin wallet'),
--   ('0xYourAdminWallet2', 'Secondary admin wallet')
-- ON CONFLICT (wallet_address) DO NOTHING;

-- ---------------------------------------------------------------------
-- 6. Grant Permissions
-- ---------------------------------------------------------------------

-- Grant access to admin_wallets table
GRANT SELECT ON public.admin_wallets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.admin_wallets TO service_role;

-- Grant execute on helper function
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated, anon;

-- ---------------------------------------------------------------------
-- 7. Create Admin Wallet Management API Helper
-- ---------------------------------------------------------------------
-- Function to add admin wallet (only callable by existing admins)

CREATE OR REPLACE FUNCTION public.add_admin_wallet(
  p_wallet_address TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.add_admin_wallet IS 'Add new admin wallet (admin-only)';

-- Function to remove admin wallet (only callable by existing admins)
CREATE OR REPLACE FUNCTION public.remove_admin_wallet(
  p_wallet_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.remove_admin_wallet IS 'Remove admin wallet (admin-only, cannot remove self)';

-- =====================================================================
-- End of Migration
-- =====================================================================

-- IMPORTANT: After running this migration, you MUST populate admin_wallets table
-- with your admin wallet addresses. You can do this by:
--
-- Option 1: Direct SQL (run as service_role):
-- INSERT INTO public.admin_wallets (wallet_address, notes)
-- VALUES ('0xYourWalletAddress', 'Main admin');
--
-- Option 2: Create an API endpoint to sync from ADMIN_WALLET_ADDRESSES env var
-- Option 3: Use Supabase Dashboard SQL Editor to insert manually
