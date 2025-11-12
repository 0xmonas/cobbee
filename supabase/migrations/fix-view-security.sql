-- ============================================================================
-- FIX: Security Definer View Warning
-- ============================================================================
-- Problem: VIEW created with SECURITY DEFINER (bypasses RLS)
-- Solution: Recreate with SECURITY INVOKER (enforces RLS)
-- ============================================================================

-- Drop existing view
DROP VIEW IF EXISTS public.public_creator_profiles CASCADE;

-- Recreate with SECURITY INVOKER
CREATE VIEW public.public_creator_profiles
WITH (security_invoker=on)  -- ✅ FIX: Use caller's permissions, enforce RLS
AS
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
'Public creator profiles with supporter count. Used for discover page to prevent N+1 queries. Email and private settings excluded for security. Uses SECURITY INVOKER to enforce RLS.';

-- Grant permissions
GRANT SELECT ON public.public_creator_profiles TO anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this, the linter warning should be gone ✅
-- ============================================================================
