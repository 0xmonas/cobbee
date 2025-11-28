import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Milestones API - GET
 *
 * GET /api/milestones?creator_id=xxx
 *
 * Fetches milestones for a specific creator
 * Public endpoint - no authentication required
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const creatorId = searchParams.get('creator_id')

    if (!creatorId) {
      return Response.json(
        { error: 'creator_id query parameter is required' },
        { status: 400 }
      )
    }

    // Fetch milestones for the creator
    // Only return non-deleted milestones
    const { data: milestones, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('creator_id', creatorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch milestones:', error)
      return Response.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      )
    }

    return Response.json({ milestones })
  } catch (error) {
    console.error('Milestones GET error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Milestones API - POST
 *
 * POST /api/milestones
 *
 * Creates a new milestone for the authenticated creator
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, description, goal_amount, color } = body

    // Validate required fields
    if (!title || title.trim().length === 0) {
      return Response.json(
        { error: 'Title is required', field: 'title' },
        { status: 400 }
      )
    }

    if (title.length > 100) {
      return Response.json(
        { error: 'Title must be 100 characters or less', field: 'title' },
        { status: 400 }
      )
    }

    if (description && description.length > 500) {
      return Response.json(
        { error: 'Description must be 500 characters or less', field: 'description' },
        { status: 400 }
      )
    }

    if (!goal_amount || goal_amount <= 0 || goal_amount > 1000000) {
      return Response.json(
        { error: 'Goal amount must be between 1 and 1,000,000', field: 'goal_amount' },
        { status: 400 }
      )
    }

    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return Response.json(
        { error: 'Color must be a valid hex code (e.g., #00FF00)', field: 'color' },
        { status: 400 }
      )
    }

    // Check active milestone limit (max 3)
    const { data: activeMilestones, error: countError } = await supabase
      .from('milestones')
      .select('id')
      .eq('creator_id', authUser.id)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (countError) {
      console.error('Failed to count active milestones:', countError)
      return Response.json(
        { error: 'Failed to validate milestone limit' },
        { status: 500 }
      )
    }

    if (activeMilestones && activeMilestones.length >= 3) {
      return Response.json(
        { error: 'Maximum 3 active milestones allowed. Please deactivate an existing milestone first.' },
        { status: 400 }
      )
    }

    // Create milestone
    const { data: milestone, error: createError } = await supabase
      .from('milestones')
      .insert({
        creator_id: authUser.id,
        title: title.trim(),
        description: description?.trim() || null,
        goal_amount,
        color,
        status: 'draft',
        is_active: false,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create milestone:', createError)
      return Response.json(
        { error: 'Failed to create milestone' },
        { status: 500 }
      )
    }

    return Response.json({ milestone }, { status: 201 })
  } catch (error) {
    console.error('Milestones POST error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
