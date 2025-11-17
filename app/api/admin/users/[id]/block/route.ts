import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import { strictRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'
import { sanitizeText } from '@/lib/security/sanitize'
import { createAuditLog } from '@/lib/utils/audit-logger'

/**
 * Admin User Block API
 *
 * POST /api/admin/users/[id]/block
 *
 * Blocks/bans a user account (admin only)
 * Features:
 * - Admin authorization check
 * - Rate limiting (3 req/min for admin actions)
 * - Audit logging with geolocation
 * - Input sanitization
 * - Database function call (admin_block_user)
 */

interface BlockUserBody {
  reason?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting - 3 admin actions per minute per IP (strict)
    const identifier = getRateLimitIdentifier(request)
    const { success: rateLimitOk, reset } = await strictRateLimit.limit(identifier)

    if (!rateLimitOk) {
      // Log rate limit exceeded
      const supabase = await createClient()
      await createAuditLog({
        request,
        supabase,
        eventType: 'rate_limit_exceeded',
        actorType: 'anonymous',
        metadata: { endpoint: '/api/admin/users/[id]/block' },
      })

      return Response.json(
        {
          error: 'Too many admin actions. Please try again later.',
          retryAfter: reset,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      )
    }

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      // Log unauthorized access
      await createAuditLog({
        request,
        supabase,
        eventType: 'unauthorized_access',
        actorType: 'anonymous',
        metadata: { endpoint: '/api/admin/users/[id]/block' },
      })

      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin's wallet address
    const { data: adminProfile } = await supabase
      .from('users')
      .select('wallet_address, username')
      .eq('id', authUser.id)
      .single()

    const walletAddress = adminProfile?.wallet_address

    // Verify admin access
    if (!isAdminWallet(walletAddress)) {
      // Log unauthorized admin attempt
      await createAuditLog({
        request,
        supabase,
        eventType: 'unauthorized_access',
        actorType: 'user',
        actorId: authUser.id,
        metadata: {
          endpoint: '/api/admin/users/[id]/block',
          attempted_action: 'block_user',
        },
      })

      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body: BlockUserBody = await request.json()
    const reason = body.reason || 'Violation of platform policies'

    // Sanitize reason (XSS protection)
    const sanitizedReason = sanitizeText(reason).slice(0, 500) // Max 500 chars

    // Get target user ID from params
    const { id: targetUserId } = await params

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetUserId)) {
      return Response.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Check if trying to block self
    if (targetUserId === authUser.id) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Use admin client to call block function
    const adminSupabase = createAdminClient()

    const { data: result, error: blockError } = await adminSupabase.rpc(
      'admin_block_user',
      {
        p_user_id: targetUserId,
        p_admin_id: authUser.id,
        p_reason: sanitizedReason,
      }
    )

    if (blockError) {
      console.error('Block user error:', blockError)

      // Log failed admin action
      await createAuditLog({
        request,
        supabase,
        eventType: 'admin_action',
        actorType: 'admin',
        actorId: authUser.id,
        targetType: 'user',
        targetId: targetUserId,
        metadata: {
          action: 'block_user',
          status: 'failed',
          error: blockError.message,
        },
      })

      return Response.json(
        { error: blockError.message || 'Failed to block user' },
        { status: 500 }
      )
    }

    // Type the result from RPC
    const blockResult = result as unknown as {
      success: boolean
      user_id: string
      username: string
      blocked_at: string
      blocked_by: string
      reason: string
    }

    // Audit log is created inside admin_block_user function,
    // but we also create one here with enriched geolocation/device info
    await createAuditLog({
      request,
      supabase,
      eventType: 'user_blocked',
      actorType: 'admin',
      actorId: authUser.id,
      targetType: 'user',
      targetId: targetUserId,
      changes: {
        old: { is_blocked: false },
        new: { is_blocked: true, reason: sanitizedReason },
      },
      metadata: {
        admin_username: adminProfile?.username,
        target_username: blockResult?.username,
        reason: sanitizedReason,
      },
    })

    return Response.json(
      {
        success: true,
        message: 'User blocked successfully',
        userId: blockResult?.user_id,
        username: blockResult?.username,
        blockedAt: blockResult?.blocked_at,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Block user API error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to block user' },
      { status: 500 }
    )
  }
}
