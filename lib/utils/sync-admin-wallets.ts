/**
 * Admin Wallet Sync Utility
 *
 * Syncs admin wallet addresses from environment variables to database
 * This allows RLS policies to work at database level
 */

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Sync admin wallets from ADMIN_WALLET_ADDRESSES env var to database
 * Should be called:
 * - On application startup
 * - When admin wallets are updated
 * - Periodically (e.g., every hour)
 */
export async function syncAdminWallets(): Promise<{
  success: boolean
  syncedCount: number
  error?: string
}> {
  try {
    const adminWalletsEnv = process.env.ADMIN_WALLET_ADDRESSES

    if (!adminWalletsEnv) {
      console.warn('[Admin Sync] ADMIN_WALLET_ADDRESSES not set in environment')
      return { success: false, syncedCount: 0, error: 'ADMIN_WALLET_ADDRESSES not configured' }
    }

    // Parse comma-separated wallet addresses
    const walletAddresses = adminWalletsEnv
      .split(',')
      .map(addr => addr.trim().toLowerCase())
      .filter(addr => addr.length > 0)

    if (walletAddresses.length === 0) {
      console.warn('[Admin Sync] No valid wallet addresses found in ADMIN_WALLET_ADDRESSES')
      return { success: false, syncedCount: 0, error: 'No valid wallet addresses' }
    }

    const supabase = createAdminClient()

    // Get existing admin wallets from database
    const { data: existingWallets, error: fetchError } = await supabase
      .from('admin_wallets')
      .select('wallet_address')

    if (fetchError) {
      console.error('[Admin Sync] Failed to fetch existing wallets:', fetchError)
      return { success: false, syncedCount: 0, error: fetchError.message }
    }

    const existingSet = new Set(
      (existingWallets || []).map(w => w.wallet_address.toLowerCase())
    )

    // Prepare wallets to insert (those not already in database)
    const walletsToInsert = walletAddresses
      .filter(addr => !existingSet.has(addr))
      .map(addr => ({
        wallet_address: addr,
        notes: 'Auto-synced from environment',
        added_at: new Date().toISOString(),
      }))

    // Insert new admin wallets
    if (walletsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('admin_wallets')
        .insert(walletsToInsert)

      if (insertError) {
        console.error('[Admin Sync] Failed to insert wallets:', insertError)
        return { success: false, syncedCount: 0, error: insertError.message }
      }

      console.warn(`[Admin Sync] ✅ Synced ${walletsToInsert.length} admin wallets to database`)
    } else {
      console.warn('[Admin Sync] ✅ All admin wallets already in database')
    }

    // Optional: Remove wallets from DB that are no longer in env
    const walletsToRemove = Array.from(existingSet)
      .filter(addr => !walletAddresses.includes(addr))

    if (walletsToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('admin_wallets')
        .delete()
        .in('wallet_address', walletsToRemove)

      if (deleteError) {
        console.error('[Admin Sync] Failed to remove old wallets:', deleteError)
        // Don't fail the sync, just log
      } else {
        console.warn(`[Admin Sync] 🗑️  Removed ${walletsToRemove.length} wallets no longer in env`)
      }
    }

    return {
      success: true,
      syncedCount: walletsToInsert.length,
    }
  } catch (error) {
    console.error('[Admin Sync] Unexpected error:', error)
    return {
      success: false,
      syncedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * API route handler to manually trigger sync
 * Can be called via cron or manual trigger
 */
export async function handleSyncRequest(): Promise<Response> {
  const result = await syncAdminWallets()

  if (result.success) {
    return Response.json({
      success: true,
      message: `Synced ${result.syncedCount} admin wallets`,
      syncedCount: result.syncedCount,
    })
  } else {
    return Response.json({
      success: false,
      error: result.error,
    }, { status: 500 })
  }
}
