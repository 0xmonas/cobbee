import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteAvatar, deleteCover } from '@/lib/storage-utils'

/**
 * User Account Deletion API
 *
 * DELETE /api/user/account
 *
 * Permanently deletes user account including:
 * - Avatar and cover images from storage
 * - User profile from public.users (CASCADE)
 * - Auth user from auth.users (triggers CASCADE)
 *
 * Requires authentication
 * IRREVERSIBLE OPERATION
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

    // Get user data before deletion (for cleanup)
    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url, cover_image_url')
      .eq('id', user.id)
      .single()

    // Step 1: Delete avatar from storage if exists
    if (userData?.avatar_url) {
      try {
        await deleteAvatar(user.id, supabase)
      } catch (error) {
        console.error('Failed to delete avatar during account deletion:', error)
        // Continue with deletion even if storage cleanup fails
      }
    }

    // Step 2: Delete cover from storage if exists
    if (userData?.cover_image_url) {
      try {
        await deleteCover(user.id, supabase)
      } catch (error) {
        console.error('Failed to delete cover during account deletion:', error)
        // Continue with deletion even if storage cleanup fails
      }
    }

    // Step 3: Delete auth.users using admin client
    // This will CASCADE delete public.users automatically
    // SECURITY: We already verified user.id is the authenticated user above
    const adminClient = createAdminClient()
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      console.error('Auth user deletion error:', authDeleteError)
      return Response.json(
        { error: 'Failed to delete authentication account' },
        { status: 500 }
      )
    }

    // Sign out the user (cleanup session)
    await supabase.auth.signOut()

    return Response.json({
      success: true,
      message: 'Account deleted successfully',
      username: userData?.username
    }, { status: 200 })

  } catch (error) {
    console.error('Account deletion error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Deletion failed' },
      { status: 500 }
    )
  }
}
