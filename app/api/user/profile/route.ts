import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  validateFullName,
  validateUsername,
  validateBio,
  validateSocialUsername
} from '@/lib/utils/validation'
import { apiRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'
import { sanitizeText, sanitizeName } from '@/lib/security/sanitize'
import { createAuditLog } from '@/lib/utils/audit-logger'

/**
 * User Profile Update API
 *
 * PATCH /api/user/profile
 *
 * Updates user profile information (display name, username, bio, social handles)
 * Requires authentication
 * Features:
 * - Server-side validation
 * - Username uniqueness check
 * - Username change tracking (path revalidation)
 * - Cache revalidation
 * - RLS protected
 */
export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting - 30 profile updates per minute per IP
    const identifier = getRateLimitIdentifier(request)
    const { success: rateLimitOk, reset } = await apiRateLimit.limit(identifier)

    if (!rateLimitOk) {
      return Response.json(
        {
          error: 'Too many profile update requests. Please try again later.',
          retryAfter: reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000))
          }
        }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      displayName,
      username,
      bio,
      twitter,
      instagram,
      github,
      tiktok,
      opensea,
    } = body

    // Server-side validation
    const errors: Record<string, string> = {}

    // Validate display name
    const displayNameError = validateFullName(displayName)
    if (displayNameError) errors.displayName = displayNameError

    // Validate username
    const usernameError = validateUsername(username)
    if (usernameError) errors.username = usernameError

    // Validate bio
    if (bio) {
      const bioError = validateBio(bio)
      if (bioError) errors.bio = bioError
    }

    // Validate social handles
    if (twitter) {
      const twitterError = validateSocialUsername(twitter)
      if (twitterError) errors.twitter = twitterError
    }

    if (instagram) {
      const instagramError = validateSocialUsername(instagram)
      if (instagramError) errors.instagram = instagramError
    }

    if (github) {
      const githubError = validateSocialUsername(github)
      if (githubError) errors.github = githubError
    }

    if (tiktok) {
      const tiktokError = validateSocialUsername(tiktok)
      if (tiktokError) errors.tiktok = tiktokError
    }

    if (opensea) {
      const openseaError = validateSocialUsername(opensea)
      if (openseaError) errors.opensea = openseaError
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return Response.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      )
    }

    // Get current user data to check username change and track changes
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('username, display_name, bio, twitter_handle, instagram_handle, github_handle, tiktok_handle, opensea_handle')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      return Response.json(
        { error: 'Failed to fetch current user data' },
        { status: 500 }
      )
    }

    const oldUsername = currentUser.username
    const usernameChanged = oldUsername !== username

    // Check username uniqueness if username changed
    if (usernameChanged) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (existingUser) {
        return Response.json(
          { error: 'Username already taken', errors: { username: 'This username is already taken' } },
          { status: 409 }
        )
      }
    }

    // Sanitize user inputs before storing (XSS protection)
    const sanitizedDisplayName = sanitizeName(displayName)
    const sanitizedBio = bio ? sanitizeText(bio) : null
    const sanitizedTwitter = twitter ? sanitizeText(twitter) : null
    const sanitizedInstagram = instagram ? sanitizeText(instagram) : null
    const sanitizedGithub = github ? sanitizeText(github) : null
    const sanitizedTiktok = tiktok ? sanitizeText(tiktok) : null
    const sanitizedOpensea = opensea ? sanitizeText(opensea) : null

    // Update user profile in database (RLS protected)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        display_name: sanitizedDisplayName,
        username: username, // Username already validated with strict rules, no need to sanitize
        bio: sanitizedBio,
        twitter_handle: sanitizedTwitter,
        instagram_handle: sanitizedInstagram,
        github_handle: sanitizedGithub,
        tiktok_handle: sanitizedTiktok,
        opensea_handle: sanitizedOpensea,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)

      // Handle specific database errors
      if (updateError.code === '23505') {
        // Unique constraint violation
        return Response.json(
          { error: 'Username already taken', errors: { username: 'This username is already taken' } },
          { status: 409 }
        )
      }

      return Response.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    // Track what changed for audit log
    const changes: Record<string, { old: any; new: any }> = {}
    if (currentUser.display_name !== sanitizedDisplayName) {
      changes.display_name = { old: currentUser.display_name, new: sanitizedDisplayName }
    }
    if (currentUser.username !== username) {
      changes.username = { old: currentUser.username, new: username }
    }
    if (currentUser.bio !== sanitizedBio) {
      changes.bio = { old: currentUser.bio, new: sanitizedBio }
    }
    if (currentUser.twitter_handle !== sanitizedTwitter) {
      changes.twitter_handle = { old: currentUser.twitter_handle, new: sanitizedTwitter }
    }
    if (currentUser.instagram_handle !== sanitizedInstagram) {
      changes.instagram_handle = { old: currentUser.instagram_handle, new: sanitizedInstagram }
    }
    if (currentUser.github_handle !== sanitizedGithub) {
      changes.github_handle = { old: currentUser.github_handle, new: sanitizedGithub }
    }
    if (currentUser.tiktok_handle !== sanitizedTiktok) {
      changes.tiktok_handle = { old: currentUser.tiktok_handle, new: sanitizedTiktok }
    }
    if (currentUser.opensea_handle !== sanitizedOpensea) {
      changes.opensea_handle = { old: currentUser.opensea_handle, new: sanitizedOpensea }
    }

    // Create audit log with geolocation and device info
    await createAuditLog({
      request,
      supabase,
      eventType: 'profile_updated',
      actorType: 'user',
      actorId: user.id,
      targetType: 'user',
      targetId: user.id,
      changes,
      metadata: {
        fields_changed: Object.keys(changes),
        username_changed: usernameChanged,
      },
    })

    // Revalidate cached pages
    revalidatePath('/profile/edit')
    revalidatePath('/dashboard')

    // If username changed, revalidate both old and new username paths
    if (usernameChanged) {
      revalidatePath(`/${oldUsername}`)
      revalidatePath(`/${username}`)
    } else {
      revalidatePath(`/${username}`)
    }

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      usernameChanged,
      ...(usernameChanged && {
        oldUsername,
        newUsername: username,
        redirectUrl: `/${username}`
      })
    }, { status: 200 })

  } catch (error) {
    console.error('Profile update error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Update failed' },
      { status: 500 }
    )
  }
}
