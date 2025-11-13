import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/support/[id]/hide
 *
 * Toggle hide/unhide status for a support message (creator only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the support record
    const { data: support, error: supportError } = await supabase
      .from('supports')
      .select('id, creator_id, is_hidden_by_creator')
      .eq('id', id)
      .single()

    if (supportError || !support) {
      return Response.json(
        { error: 'Support not found' },
        { status: 404 }
      )
    }

    // Check if user is the creator
    if (support.creator_id !== authUser.id) {
      return Response.json(
        { error: 'Forbidden - You can only hide/unhide your own support messages' },
        { status: 403 }
      )
    }

    // Toggle the hidden status
    const newHiddenStatus = !support.is_hidden_by_creator

    const { error: updateError } = await supabase
      .from('supports')
      .update({ is_hidden_by_creator: newHiddenStatus })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update support:', updateError)
      return Response.json(
        { error: 'Failed to update support' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      is_hidden_by_creator: newHiddenStatus,
    })

  } catch (error) {
    console.error('Hide support error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to hide support' },
      { status: 500 }
    )
  }
}
