import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Milestone API - PATCH
 *
 * PATCH /api/milestones/[id]
 *
 * Updates an existing milestone
 * Requires authentication and ownership
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check authentication
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch existing milestone to verify ownership
    const { data: existingMilestone, error: fetchError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingMilestone) {
      return Response.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingMilestone.creator_id !== authUser.id) {
      return Response.json(
        { error: 'Unauthorized - you can only update your own milestones' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, description, goal_amount, color, is_active, status } = body

    // Prevent editing completed milestones
    if (existingMilestone.status === 'completed' && (title || description || goal_amount || color)) {
      return Response.json(
        { error: 'Cannot edit a completed milestone' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: Record<string, any> = {}

    if (title !== undefined) {
      if (title.trim().length === 0) {
        return Response.json(
          { error: 'Title cannot be empty', field: 'title' },
          { status: 400 }
        )
      }
      if (title.length > 100) {
        return Response.json(
          { error: 'Title must be 100 characters or less', field: 'title' },
          { status: 400 }
        )
      }
      updates.title = title.trim()
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        return Response.json(
          { error: 'Description must be 500 characters or less', field: 'description' },
          { status: 400 }
        )
      }
      updates.description = description?.trim() || null
    }

    if (goal_amount !== undefined) {
      if (goal_amount <= 0 || goal_amount > 1000000) {
        return Response.json(
          { error: 'Goal amount must be between 1 and 1,000,000', field: 'goal_amount' },
          { status: 400 }
        )
      }
      updates.goal_amount = goal_amount
    }

    if (color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return Response.json(
          { error: 'Color must be a valid hex code (e.g., #00FF00)', field: 'color' },
          { status: 400 }
        )
      }
      updates.color = color
    }

    if (is_active !== undefined) {
      // Check active milestone limit when activating
      if (is_active && !existingMilestone.is_active) {
        const { data: activeMilestones, error: countError } = await supabase
          .from('milestones')
          .select('id')
          .eq('creator_id', authUser.id)
          .eq('is_active', true)
          .is('deleted_at', null)
          .neq('id', id)

        if (countError) {
          console.error('Failed to count active milestones:', countError)
          return Response.json(
            { error: 'Failed to validate milestone limit' },
            { status: 500 }
          )
        }

        if (activeMilestones && activeMilestones.length >= 3) {
          return Response.json(
            { error: 'Maximum 3 active milestones allowed. Please deactivate another milestone first.' },
            { status: 400 }
          )
        }

        // Set activated_at timestamp when activating for the first time
        if (!existingMilestone.activated_at) {
          updates.activated_at = new Date().toISOString()
        }
      }

      updates.is_active = is_active
    }

    if (status !== undefined) {
      if (!['draft', 'active', 'completed', 'archived'].includes(status)) {
        return Response.json(
          { error: 'Invalid status value', field: 'status' },
          { status: 400 }
        )
      }
      updates.status = status
    }

    // Update milestone
    const { data: milestone, error: updateError } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update milestone:', updateError)
      return Response.json(
        { error: 'Failed to update milestone' },
        { status: 500 }
      )
    }

    return Response.json({ milestone })
  } catch (error) {
    console.error('Milestone PATCH error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Milestone API - DELETE
 *
 * DELETE /api/milestones/[id]
 *
 * Soft deletes a milestone (sets deleted_at timestamp)
 * Requires authentication and ownership
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check authentication
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch existing milestone to verify ownership
    const { data: existingMilestone, error: fetchError } = await supabase
      .from('milestones')
      .select('creator_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingMilestone) {
      return Response.json(
        { error: 'Milestone not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingMilestone.creator_id !== authUser.id) {
      return Response.json(
        { error: 'Unauthorized - you can only delete your own milestones' },
        { status: 403 }
      )
    }

    // Soft delete (set deleted_at timestamp)
    const { error: deleteError } = await supabase
      .from('milestones')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete milestone:', deleteError)
      return Response.json(
        { error: 'Failed to delete milestone' },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Milestone DELETE error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
