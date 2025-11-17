-- =====================================================================
-- Migration: Add Admin Wallet to Database
-- =====================================================================
-- Description:
--   Insert admin wallet address into admin_wallets table
--   This enables database-level admin checks for RPC functions
--
-- IMPORTANT:
--   Replace the wallet address below with your actual admin wallet!
-- =====================================================================

-- Insert admin wallet (replace with your actual wallet address)
INSERT INTO public.admin_wallets (wallet_address, added_by, notes)
VALUES (
  '0xe0df49b36e44cda5679b3f65916467639c434d0d',  -- ⚠️ REPLACE WITH YOUR WALLET
  NULL,  -- No user added this (manual setup)
  'Initial admin wallet - added via migration'
)
ON CONFLICT (wallet_address) DO NOTHING;

-- Verify admin wallet was added
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.admin_wallets;

  IF v_count = 0 THEN
    RAISE WARNING 'No admin wallets found! Please update the migration with your wallet address.';
  ELSE
    RAISE NOTICE 'Admin wallets count: %', v_count;
  END IF;
END $$;

-- =====================================================================
-- SECURITY NOTE
-- =====================================================================
-- This wallet address will have full admin access to:
-- - View all analytics
-- - View all audit logs
-- - Search all users (with sensitive data)
-- - Block/unblock users
-- - Blacklist/unblacklist supporter wallets
--
-- Make sure this is YOUR wallet address!
-- =====================================================================
