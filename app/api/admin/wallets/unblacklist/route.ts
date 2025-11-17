import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import { strictRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'

/**
 * Unblacklist Supporter Wallet API
 *
 * POST /api/admin/wallets/unblacklist
 *
 * Remove a supporter wallet from blacklist
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 unblacklist requests per minute
    const identifier = getRateLimitIdentifier(request)
    const { success: rateLimitOk, reset } = await strictRateLimit.limit(identifier)

    if (!rateLimitOk) {
      return Response.json(
        {
          error: 'Too many unblacklist requests. Please try again later.',
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
    const { wallet_address } = body

    if (!wallet_address) {
      return Response.json({ error: 'wallet_address is required' }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet_address)) {
      return Response.json({ error: 'Invalid wallet address format' }, { status: 400 })
    }

    // Use admin client to call unblacklist function
    const adminSupabase = createAdminClient()

    const { data: result, error: unblacklistError } = await adminSupabase.rpc(
      'admin_unblacklist_wallet',
      {
        p_wallet_address: wallet_address.toLowerCase(),
        p_admin_wallet: walletAddress,
      }
    )

    if (unblacklistError) {
      console.error('Unblacklist wallet error:', unblacklistError)
      return Response.json(
        { error: unblacklistError.message || 'Failed to unblacklist wallet' },
        { status: 500 }
      )
    }

    // Type assertion for result
    const unblacklistResult = result as unknown as {
      success: boolean
      error?: string
    }

    if (!unblacklistResult?.success) {
      return Response.json(
        { error: unblacklistResult?.error || 'Unblacklist failed' },
        { status: 400 }
      )
    }

    return Response.json({
      success: true,
      message: 'Wallet removed from blacklist successfully',
    })
  } catch (error) {
    console.error('Unblacklist wallet error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unblacklist failed' },
      { status: 500 }
    )
  }
}
