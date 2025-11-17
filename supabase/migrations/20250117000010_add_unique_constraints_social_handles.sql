-- =====================================================================
-- Migration: Add Unique Constraints for Social Handles
-- =====================================================================
-- Description:
--   Social media handles should be unique across the platform
--   One Twitter handle can only be claimed by one creator
--
-- Why:
--   - Prevents identity theft/impersonation
--   - Ensures one person per social account
--   - Improves trust and authenticity
-- =====================================================================

-- Add unique constraints for social handles (allowing NULL values)
-- NULL values don't violate uniqueness (multiple users can have NULL)

ALTER TABLE public.users
  ADD CONSTRAINT users_twitter_handle_key UNIQUE (twitter_handle);

ALTER TABLE public.users
  ADD CONSTRAINT users_instagram_handle_key UNIQUE (instagram_handle);

ALTER TABLE public.users
  ADD CONSTRAINT users_github_handle_key UNIQUE (github_handle);

ALTER TABLE public.users
  ADD CONSTRAINT users_tiktok_handle_key UNIQUE (tiktok_handle);

ALTER TABLE public.users
  ADD CONSTRAINT users_opensea_handle_key UNIQUE (opensea_handle);

-- =====================================================================
-- Index for faster lookups (optional but recommended)
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_users_twitter_handle
  ON public.users(twitter_handle) WHERE twitter_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_instagram_handle
  ON public.users(instagram_handle) WHERE instagram_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_github_handle
  ON public.users(github_handle) WHERE github_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_tiktok_handle
  ON public.users(tiktok_handle) WHERE tiktok_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_opensea_handle
  ON public.users(opensea_handle) WHERE opensea_handle IS NOT NULL;

-- =====================================================================
-- Notes
-- =====================================================================
-- After this migration:
-- - Each social handle can only be used by ONE creator
-- - NULL values are allowed (users without that social account)
-- - Duplicate handle attempts will return error code 23505
-- - API should catch this and show friendly error message
-- =====================================================================
