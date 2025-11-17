import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import { strictRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'
import { createAuditLog } from '@/lib/utils/audit-logger'

/**
 * Admin User Unblock API
 *
 * POST /api/admin/users/[id]/unblock
 *
 * Unblocks a previously banned user account (admin only)
 * Features:
 * - Admin authorization check
 * - Rate limiting (3 req/min for admin actions)
 * - Audit logging with geolocation
 * - Database function call (admin_unblock_user)
 */

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
        metadata: { endpoint: '/api/admin/users/[id]/unblock' },
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
        metadata: { endpoint: '/api/admin/users/[id]/unblock' },
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
          endpoint: '/api/admin/users/[id]/unblock',
          attempted_action: 'unblock_user',
        },
      })

      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get target user ID from params
    const { id: targetUserId } = await params

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(targetUserId)) {
      return Response.json({ error: 'Invalid user ID format' }, { status: 400 })
    }

    // Use admin client to call unblock function
    const adminSupabase = createAdminClient()

    const { data: result, error: unblockError } = await adminSupabase.rpc(
      'admin_unblock_user',
      {
        p_user_id: targetUserId,
        p_admin_id: authUser.id,
      }
    )

    if (unblockError) {
      console.error('Unblock user error:', unblockError)

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
          action: 'unblock_user',
          status: 'failed',
          error: unblockError.message,
        },
      })

      return Response.json(
        { error: unblockError.message || 'Failed to unblock user' },
        { status: 500 }
      )
    }

    // Type the result from RPC
    const unblockResult = result as unknown as {
      success: boolean
      user_id: string
      username: string
      unblocked_at: string
      unblocked_by: string
    }

    // Audit log is created inside admin_unblock_user function,
    // but we also create one here with enriched geolocation/device info
    await createAuditLog({
      request,
      supabase,
      eventType: 'user_unblocked',
      actorType: 'admin',
      actorId: authUser.id,
      targetType: 'user',
      targetId: targetUserId,
      changes: {
        old: { is_blocked: true },
        new: { is_blocked: false },
      },
      metadata: {
        admin_username: adminProfile?.username,
        target_username: unblockResult?.username,
      },
    })

    return Response.json(
      {
        success: true,
        message: 'User unblocked successfully',
        userId: unblockResult?.user_id,
        username: unblockResult?.username,
        unblockedAt: unblockResult?.unblocked_at,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unblock user API error:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to unblock user',
      },
      { status: 500 }
    )
  }
}
