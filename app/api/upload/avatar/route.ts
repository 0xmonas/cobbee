import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadAvatar, deleteAvatar } from '@/lib/storage-utils'
import { revalidatePath } from 'next/cache'
import { apiRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'

/**
 * Avatar Upload API
 *
 * POST /api/upload/avatar
 *
 * Uploads and compresses user avatar
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 30 upload requests per minute per IP
    const identifier = getRateLimitIdentifier(request)
    const { success: rateLimitOk, reset } = await apiRateLimit.limit(identifier)

    if (!rateLimitOk) {
      return Response.json(
        {
          error: 'Too many upload requests. Please try again later.',
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

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return Response.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return Response.json(
        { error: 'File too large. Maximum size is 2MB' },
        { status: 400 }
      )
    }

    // Upload directly (compression happens on client-side)
    // IMPORTANT: Pass server-side supabase client to maintain auth context!
    const result = await uploadAvatar(file, user.id, supabase)

    if (!result.success) {
      return Response.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      )
    }

    // Update user's avatar_url in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: result.url })
      .eq('id', user.id)

    if (updateError) {
      return Response.json(
        { error: 'Failed to update avatar URL' },
        { status: 500 }
      )
    }

    // Get username for path revalidation
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    // Revalidate cached pages (Next.js cache strategy)
    revalidatePath('/profile/edit')
    revalidatePath('/dashboard')
    if (userData?.username) {
      revalidatePath(`/${userData.username}`)
    }

    return Response.json({
      success: true,
      url: result.url,
      message: 'Avatar uploaded successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Avatar upload error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * Avatar Delete API
 *
 * DELETE /api/upload/avatar
 *
 * Deletes user avatar from storage and database
 * Requires authentication
 */
export async function DELETE() {
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

    // Delete from storage (RLS protected)
    // IMPORTANT: Pass server-side supabase client to maintain auth context!
    const success = await deleteAvatar(user.id, supabase)

    if (!success) {
      return Response.json(
        { error: 'Failed to delete avatar from storage' },
        { status: 500 }
      )
    }

    // Update user's avatar_url to null in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('id', user.id)

    if (updateError) {
      return Response.json(
        { error: 'Failed to update avatar URL in database' },
        { status: 500 }
      )
    }

    // Get username for path revalidation
    const { data: userData } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    // Revalidate cached pages (Next.js cache strategy)
    revalidatePath('/profile/edit')
    revalidatePath('/dashboard')
    if (userData?.username) {
      revalidatePath(`/${userData.username}`)
    }

    return Response.json({
      success: true,
      message: 'Avatar deleted successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Avatar delete error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
