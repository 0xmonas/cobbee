-- ============================================================================
-- STEP 1: Check if storage buckets and policies exist
-- ============================================================================
-- Copy-paste this in Supabase Dashboard → SQL Editor → Run
-- ============================================================================

-- Check buckets
SELECT 'BUCKETS CHECK:' as step, id, public, file_size_limit
FROM storage.buckets
WHERE id IN ('avatars', 'covers');

-- If returns 0 rows → Buckets don't exist, run create_storage_buckets.sql
-- If returns 2 rows → Buckets exist, check policies below

-- ============================================================================
-- Check RLS policies
SELECT 'POLICIES CHECK:' as step, policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Expected: 8 policies
-- If less than 8 → Run create_storage_buckets.sql
-- If 8 policies → Everything is configured! Problem is elsewhere

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- Case 1: Buckets + Policies MISSING (0-7 policies)
--   → Run: migrations/create_storage_buckets.sql in SQL Editor
--
-- Case 2: Buckets + Policies EXIST (8 policies)
--   → Check if user is authenticated in the upload request
--   → Verify file path format: {userId}/avatar.jpg
--   → Check auth.uid() matches folder name
-- ============================================================================
