/**
 * API Route: Creator Reply to Support Message
 *
 * Endpoints:
 * - POST   /api/support/[id]/reply - Create or update reply
 * - DELETE /api/support/[id]/reply - Delete reply
 *
 * Security:
 * - Only the creator can reply to their own supports
 * - Reply length limited to 1000 characters
 * - Audit logging for all actions
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { createAuditLog } from '@/lib/utils/audit-logger'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/support/[id]/reply
 * Create or update creator reply
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id: supportId } = await context.params

  try {
    // 1. Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized', message: 'You must be logged in to reply' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const { reply } = await request.json()

    // 3. Validate reply text
    if (!reply || typeof reply !== 'string') {
      return Response.json(
        { error: 'Invalid input', message: 'Reply text is required' },
        { status: 400 }
      )
    }

    const trimmedReply = reply.trim()

    if (trimmedReply.length === 0) {
      return Response.json(
        { error: 'Invalid input', message: 'Reply cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedReply.length > 1000) {
      return Response.json(
        { error: 'Invalid input', message: 'Reply must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // 4. Fetch support and verify ownership
    const { data: support, error: fetchError } = await supabase
      .from('supports')
      .select('id, creator_id, supporter_name, creator_reply')
      .eq('id', supportId)
      .single()

    if (fetchError || !support) {
      return Response.json(
        { error: 'Not found', message: 'Support not found' },
        { status: 404 }
      )
    }

    // 5. Verify user is the creator
    if (support.creator_id !== user.id) {
      await createAuditLog({
        request,
        supabase,
        eventType: 'unauthorized_access',
        actorType: 'user',
        actorId: user.id,
        targetType: 'support',
        targetId: supportId,
        metadata: {
          action: 'reply_to_support',
          reason: 'Not the creator',
        },
      })

      return Response.json(
        { error: 'Forbidden', message: 'You can only reply to your own supports' },
        { status: 403 }
      )
    }

    // 6. Update support with reply
    const { data: updatedSupport, error: updateError } = await supabase
      .from('supports')
      .update({
        creator_reply: trimmedReply,
        creator_reply_at: new Date().toISOString(),
      })
      .eq('id', supportId)
      .select('id, creator_reply, creator_reply_at')
      .single()

    if (updateError) {
      console.error('[Reply] Failed to update support:', updateError)
      return Response.json(
        { error: 'Update failed', message: 'Failed to save reply' },
        { status: 500 }
      )
    }

    // 7. Create audit log
    await createAuditLog({
      request,
      supabase,
      eventType: 'admin_action',
      actorType: 'user',
      actorId: user.id,
      targetType: 'support',
      targetId: supportId,
      changes: {
        creator_reply: {
          from: support.creator_reply || null,
          to: trimmedReply,
        },
      },
      metadata: {
        action: support.creator_reply ? 'update_reply' : 'create_reply',
        supporter_name: support.supporter_name,
        reply_length: trimmedReply.length,
      },
    })

    // 8. Success response
    return Response.json({
      success: true,
      message: support.creator_reply ? 'Reply updated successfully' : 'Reply created successfully',
      reply: {
        creator_reply: updatedSupport.creator_reply,
        creator_reply_at: updatedSupport.creator_reply_at,
      },
    })

  } catch (error) {
    console.error('[Reply] Unexpected error:', error)
    return Response.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/support/[id]/reply
 * Delete creator reply
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const supabase = await createClient()
  const { id: supportId } = await context.params

  try {
    // 1. Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized', message: 'You must be logged in' },
        { status: 401 }
      )
    }

    // 2. Fetch support and verify ownership
    const { data: support, error: fetchError } = await supabase
      .from('supports')
      .select('id, creator_id, supporter_name, creator_reply')
      .eq('id', supportId)
      .single()

    if (fetchError || !support) {
      return Response.json(
        { error: 'Not found', message: 'Support not found' },
        { status: 404 }
      )
    }

    // 3. Verify user is the creator
    if (support.creator_id !== user.id) {
      await createAuditLog({
        request,
        supabase,
        eventType: 'unauthorized_access',
        actorType: 'user',
        actorId: user.id,
        targetType: 'support',
        targetId: supportId,
        metadata: {
          action: 'delete_reply',
          reason: 'Not the creator',
        },
      })

      return Response.json(
        { error: 'Forbidden', message: 'You can only delete your own replies' },
        { status: 403 }
      )
    }

    // 4. Check if reply exists
    if (!support.creator_reply) {
      return Response.json(
        { error: 'Not found', message: 'No reply to delete' },
        { status: 404 }
      )
    }

    // 5. Delete reply (set to NULL)
    const { error: deleteError } = await supabase
      .from('supports')
      .update({
        creator_reply: null,
        creator_reply_at: null,
      })
      .eq('id', supportId)

    if (deleteError) {
      console.error('[Reply] Failed to delete reply:', deleteError)
      return Response.json(
        { error: 'Delete failed', message: 'Failed to delete reply' },
        { status: 500 }
      )
    }

    // 6. Create audit log
    await createAuditLog({
      request,
      supabase,
      eventType: 'admin_action',
      actorType: 'user',
      actorId: user.id,
      targetType: 'support',
      targetId: supportId,
      changes: {
        creator_reply: {
          from: support.creator_reply,
          to: null,
        },
      },
      metadata: {
        action: 'delete_reply',
        supporter_name: support.supporter_name,
      },
    })

    // 7. Success response
    return Response.json({
      success: true,
      message: 'Reply deleted successfully',
    })

  } catch (error) {
    console.error('[Reply] Unexpected error:', error)
    return Response.json(
      { error: 'Server error', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
