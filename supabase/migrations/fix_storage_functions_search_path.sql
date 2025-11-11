-- ============================================================================
-- FIX: Add search_path to storage cleanup functions
-- ============================================================================
-- Purpose: Fix security warning "function_search_path_mutable"
-- Issue: SECURITY DEFINER functions need explicit search_path
-- Security: Prevents malicious schema injection attacks
-- ============================================================================

-- Fix: delete_old_avatar() - Add search_path
CREATE OR REPLACE FUNCTION delete_old_avatar()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage;

-- Fix: delete_old_cover() - Add search_path
CREATE OR REPLACE FUNCTION delete_old_cover()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage;

-- Fix: cleanup_user_files() - Add search_path
CREATE OR REPLACE FUNCTION cleanup_user_files()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION delete_old_avatar() IS
'Cleanup old avatar file when user updates their avatar URL. Security: search_path set to public, storage to prevent schema injection.';

COMMENT ON FUNCTION delete_old_cover() IS
'Cleanup old cover file when user updates their cover URL. Security: search_path set to public, storage to prevent schema injection.';

COMMENT ON FUNCTION cleanup_user_files() IS
'Cleanup all user files (avatar + cover) when user account is deleted. Security: search_path set to public, storage to prevent schema injection.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration:
-- Run Supabase linter - no more "function_search_path_mutable" warnings
-- SELECT prosrc, proconfig FROM pg_proc WHERE proname IN ('delete_old_avatar', 'delete_old_cover', 'cleanup_user_files');
-- Should see: proconfig = {search_path=public, storage}
-- ============================================================================
