import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadCover, deleteCover } from '@/lib/storage-utils'
import { revalidatePath } from 'next/cache'

/**
 * Cover Image Upload API
 *
 * POST /api/upload/cover
 *
 * Uploads and compresses user cover image
 * Requires authentication
 */
export async function POST(request: NextRequest) {
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

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return Response.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Upload directly (compression happens on client-side)
    // IMPORTANT: Pass server-side supabase client to maintain auth context!
    const result = await uploadCover(file, user.id, supabase)

    if (!result.success) {
      console.error('❌ Upload failed:', result.error)
      return Response.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      )
    }

    // Update user's cover_image_url in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ cover_image_url: result.url })
      .eq('id', user.id)

    if (updateError) {
      return Response.json(
        { error: 'Failed to update cover URL' },
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
      message: 'Cover image uploaded successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Cover upload error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

/**
 * Cover Image Delete API
 *
 * DELETE /api/upload/cover
 *
 * Deletes user cover image from storage and database
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
    const success = await deleteCover(user.id, supabase)

    if (!success) {
      return Response.json(
        { error: 'Failed to delete cover from storage' },
        { status: 500 }
      )
    }

    // Update user's cover_image_url to null in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ cover_image_url: null })
      .eq('id', user.id)

    if (updateError) {
      return Response.json(
        { error: 'Failed to update cover URL in database' },
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
      message: 'Cover image deleted successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Cover delete error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
