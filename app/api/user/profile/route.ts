import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  validateFullName,
  validateUsername,
  validateBio,
  validateSocialUsername
} from '@/lib/utils/validation'

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

    // Get current user data to check username change
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('username')
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

    // Update user profile in database (RLS protected)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        display_name: displayName,
        username: username,
        bio: bio || null,
        twitter_handle: twitter || null,
        instagram_handle: instagram || null,
        github_handle: github || null,
        tiktok_handle: tiktok || null,
        opensea_handle: opensea || null,
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
