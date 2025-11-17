import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminWallet } from '@/lib/utils/admin'
import { syncAdminWallets } from '@/lib/utils/sync-admin-wallets'
import { strictRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'

/**
 * Admin Wallet Sync API
 *
 * POST /api/admin/sync-wallets
 *
 * Syncs admin wallet addresses from ADMIN_WALLET_ADDRESSES env var to database
 * This enables RLS policies to work at database level
 *
 * Security:
 * - Admin wallet verification
 * - Rate limiting (3 req/min)
 * - Only syncs from environment variables
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - strict for admin operations
    const identifier = getRateLimitIdentifier(request)
    const { success: rateLimitOk, reset } = await strictRateLimit.limit(identifier)

    if (!rateLimitOk) {
      return Response.json(
        {
          error: 'Too many sync requests',
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

    // Get user's wallet address and verify admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('wallet_address')
      .eq('id', authUser.id)
      .single()

    const walletAddress = userProfile?.wallet_address

    if (!isAdminWallet(walletAddress)) {
      return Response.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Perform sync
    const result = await syncAdminWallets()

    if (result.success) {
      return Response.json({
        success: true,
        message: `Successfully synced admin wallets`,
        syncedCount: result.syncedCount,
      })
    } else {
      return Response.json(
        {
          success: false,
          error: result.error || 'Sync failed',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Admin wallet sync error:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Sync failed',
      },
      { status: 500 }
    )
  }
}
