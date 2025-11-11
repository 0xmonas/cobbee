-- Migration: Update public_creator_profiles view
-- Purpose: Add supporter_count to eliminate N+1 queries for discover page
-- Performance: 1000 creators = 1 query instead of 1001
-- Security: Maintains existing view structure, no email/private fields exposed

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.public_creator_profiles CASCADE;

-- Create the updated view (same columns as original + supporter_count)
CREATE VIEW public.public_creator_profiles AS
SELECT
  u.id,
  u.wallet_address,
  u.username,
  u.display_name,
  u.bio,
  u.avatar_url,
  u.cover_image_url,
  u.twitter_handle,
  u.instagram_handle,
  u.github_handle,
  u.tiktok_handle,
  u.opensea_handle,
  u.coffee_price,
  u.created_at,
  -- NEW: Calculate supporter count with LEFT JOIN
  COUNT(DISTINCT s.supporter_wallet_address) FILTER (WHERE s.status = 'confirmed') as supporter_count
FROM
  public.users u
LEFT JOIN
  public.supports s ON u.id = s.creator_id
WHERE
  u.is_active = true
GROUP BY
  u.id;

-- Add comment
COMMENT ON VIEW public.public_creator_profiles IS
'Public creator profiles with supporter count. Used for discover page to prevent N+1 queries. Email and private settings excluded for security.';

-- Grant permissions
GRANT SELECT ON public.public_creator_profiles TO anon, authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_supports_creator_wallet
ON public.supports(creator_id, supporter_wallet_address)
WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_users_active_created
ON public.users(is_active, created_at DESC)
WHERE is_active = true;
