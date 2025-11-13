-- ============================================================================
-- CLEAN DROP ALL ADMIN VIEWS
-- ============================================================================
-- Purpose: Completely remove all admin views that may have SECURITY DEFINER
-- This migration should be run BEFORE recreating them without SECURITY DEFINER
-- ============================================================================

-- Drop all admin views (CASCADE to remove dependencies)
DROP VIEW IF EXISTS admin_platform_stats CASCADE;
DROP VIEW IF EXISTS admin_suspicious_wallets CASCADE;
DROP VIEW IF EXISTS admin_top_creators CASCADE;
DROP VIEW IF EXISTS admin_recent_activity CASCADE;
DROP VIEW IF EXISTS admin_failed_payments CASCADE;

-- ============================================================================
-- COMPLETE
-- ============================================================================
-- All admin views dropped. Now run the next migration to recreate them properly.
-- ============================================================================
