import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import { strictRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'

/**
 * Blacklist Supporter Wallet API
 *
 * POST /api/admin/wallets/blacklist
 *
 * Blacklist a supporter wallet address for fraud prevention
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 blacklist requests per minute
    const identifier = getRateLimitIdentifier(request)
    const { success: rateLimitOk, reset } = await strictRateLimit.limit(identifier)

    if (!rateLimitOk) {
      return Response.json(
        {
          error: 'Too many blacklist requests. Please try again later.',
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
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's wallet address
    const { data: userProfile } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', authUser.id)
      .single()

    const walletAddress = userProfile?.wallet_address

    // Verify admin access
    if (!isAdminWallet(walletAddress)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { wallet_address, reason, notes, ban_scope } = body

    if (!wallet_address || !reason) {
      return Response.json(
        { error: 'wallet_address and reason are required' },
        { status: 400 }
      )
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return Response.json({ error: 'Invalid wallet address format' }, { status: 400 })
    }

    // Use admin client to call blacklist function
    const adminSupabase = createAdminClient()

    const { data: result, error: blacklistError } = await adminSupabase.rpc(
      'admin_blacklist_wallet',
      {
        p_wallet_address: wallet_address.toLowerCase(),
        p_reason: reason,
        p_notes: notes || null,
        p_admin_wallet: walletAddress,
        p_ban_scope: ban_scope || 'full',
      }
    )

    if (blacklistError) {
      console.error('Blacklist wallet error:', blacklistError)
      return Response.json(
        { error: blacklistError.message || 'Failed to blacklist wallet' },
        { status: 500 }
      )
    }

    // Type assertion for result
    const blacklistResult = result as unknown as {
      success: boolean
      blacklist_id: string
      affected_pending_supports: number
    }

    return Response.json({
      success: true,
      message: 'Wallet blacklisted successfully',
      blacklistId: blacklistResult?.blacklist_id,
      affectedSupports: blacklistResult?.affected_pending_supports,
    })
  } catch (error) {
    console.error('Blacklist wallet error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Blacklist failed' },
      { status: 500 }
    )
  }
}
