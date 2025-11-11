-- ============================================================================
-- STORAGE BUCKETS FOR AVATARS & COVER IMAGES
-- ============================================================================
-- Purpose: Secure file storage for creator profile images
-- Buckets: avatars (2MB max), covers (5MB max)
-- Security: RLS policies, MIME type validation, size limits
-- ============================================================================

-- ============================================================================
-- 1. CREATE BUCKETS
-- ============================================================================

-- Avatars bucket (creator profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,  -- Public bucket (anyone can read)
  2097152,  -- 2MB in bytes (2 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']  -- Allowed formats
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Cover images bucket (profile banners)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,  -- Public bucket (anyone can read)
  5242880,  -- 5MB in bytes (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']  -- Allowed formats
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- 2. STORAGE RLS POLICIES - AVATARS
-- ============================================================================

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 3. STORAGE RLS POLICIES - COVERS
-- ============================================================================

-- Policy: Anyone can view covers (public bucket)
CREATE POLICY "Covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'covers');

-- Policy: Authenticated users can upload their own cover
CREATE POLICY "Users can upload their own cover"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own cover
CREATE POLICY "Users can update their own cover"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own cover
CREATE POLICY "Users can delete their own cover"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Note: Storage URL generation is handled in frontend (lib/storage-utils.ts)
-- to support custom domain configuration via NEXT_PUBLIC_STORAGE_URL env variable

-- Function: Delete old file before updating (cleanup)
-- Works with both Supabase URLs and custom domain URLs
CREATE OR REPLACE FUNCTION delete_old_avatar()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.avatar_url IS NOT NULL
     AND OLD.avatar_url != NEW.avatar_url
     AND (OLD.avatar_url LIKE '%/avatars/%' OR OLD.avatar_url LIKE '%avatars/%') THEN
    -- Extract file path from URL (supports both formats)
    -- Format 1: https://xxx.supabase.co/storage/v1/object/public/avatars/{userId}/avatar.jpg
    -- Format 2: https://cdn.cobbee.fun/avatars/{userId}/avatar.jpg
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Works with both Supabase URLs and custom domain URLs
CREATE OR REPLACE FUNCTION delete_old_cover()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.cover_image_url IS NOT NULL
     AND OLD.cover_image_url != NEW.cover_image_url
     AND (OLD.cover_image_url LIKE '%/covers/%' OR OLD.cover_image_url LIKE '%covers/%') THEN
    -- Extract file path from URL (supports both formats)
    -- Format 1: https://xxx.supabase.co/storage/v1/object/public/covers/{userId}/cover.jpg
    -- Format 2: https://cdn.cobbee.fun/covers/{userId}/cover.jpg
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGERS FOR CLEANUP
-- ============================================================================

-- Trigger: Delete old avatar when updated
DROP TRIGGER IF EXISTS cleanup_old_avatar ON public.users;
CREATE TRIGGER cleanup_old_avatar
  BEFORE UPDATE OF avatar_url ON public.users
  FOR EACH ROW
  WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
  EXECUTE FUNCTION delete_old_avatar();

-- Trigger: Delete old cover when updated
DROP TRIGGER IF EXISTS cleanup_old_cover ON public.users;
CREATE TRIGGER cleanup_old_cover
  BEFORE UPDATE OF cover_image_url ON public.users
  FOR EACH ROW
  WHEN (OLD.cover_image_url IS DISTINCT FROM NEW.cover_image_url)
  EXECUTE FUNCTION delete_old_cover();

-- Trigger: Cleanup files when user deleted (supports both URL formats)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS cleanup_user_files_on_delete ON public.users;
CREATE TRIGGER cleanup_user_files_on_delete
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_user_files();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION delete_old_avatar() IS
'Cleanup old avatar file when user updates their avatar URL';

COMMENT ON FUNCTION delete_old_cover() IS
'Cleanup old cover file when user updates their cover URL';

COMMENT ON FUNCTION cleanup_user_files() IS
'Cleanup all user files (avatar + cover) when user account is deleted';

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Frontend: Upload avatar
const file = event.target.files[0]
const fileExt = file.name.split('.').pop()
const fileName = `${user.id}/avatar.${fileExt}`

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file, { upsert: true })

if (data) {
  const publicUrl = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName).data.publicUrl

  // Update user profile
  await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)
}

-- Frontend: Upload cover
const file = event.target.files[0]
const fileExt = file.name.split('.').pop()
const fileName = `${user.id}/cover.${fileExt}`

const { data, error } = await supabase.storage
  .from('covers')
  .upload(fileName, file, { upsert: true })

if (data) {
  const publicUrl = supabase.storage
    .from('covers')
    .getPublicUrl(fileName).data.publicUrl

  // Update user profile
  await supabase
    .from('users')
    .update({ cover_image_url: publicUrl })
    .eq('id', user.id)
}
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration:
-- 1. Check buckets exist: SELECT * FROM storage.buckets WHERE id IN ('avatars', 'covers');
-- 2. Check policies: SELECT * FROM storage.policies WHERE bucket_id IN ('avatars', 'covers');
-- 3. Test upload via Supabase Storage UI
-- 4. Verify file size limits work (try uploading 10MB image)
-- 5. Verify MIME type restrictions work (try uploading PDF)
-- ============================================================================
