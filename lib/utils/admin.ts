import 'server-only'

/**
 * Admin Utilities
 *
 * Server-side only utilities for admin authentication and authorization.
 * NEVER import this file in client components!
 */

/**
 * Get admin wallet addresses from environment variable
 * Returns array of checksummed wallet addresses
 */
export function getAdminWallets(): string[] {
  const adminWalletsEnv = process.env.ADMIN_WALLET_ADDRESSES

  if (!adminWalletsEnv || adminWalletsEnv.trim() === '') {
    console.warn('[Admin] No admin wallets configured. Set ADMIN_WALLET_ADDRESSES in .env')
    return []
  }

  // Split by comma and trim whitespace
  const wallets = adminWalletsEnv
    .split(',')
    .map(wallet => wallet.trim())
    .filter(wallet => wallet.length > 0)

  return wallets
}

/**
 * Check if a wallet address is an admin wallet
 * Case-insensitive comparison
 */
export function isAdminWallet(walletAddress: string | null | undefined): boolean {
  if (!walletAddress) {
    return false
  }

  const adminWallets = getAdminWallets()

  if (adminWallets.length === 0) {
    console.warn('[Admin] No admin wallets configured')
    return false
  }

  // Case-insensitive comparison
  const normalizedWallet = walletAddress.toLowerCase()
  return adminWallets.some(adminWallet =>
    adminWallet.toLowerCase() === normalizedWallet
  )
}

/**
 * Get the first admin wallet (for logging purposes)
 * Returns null if no admin wallets configured
 */
export function getPrimaryAdminWallet(): string | null {
  const wallets = getAdminWallets()
  return wallets.length > 0 ? wallets[0] : null
}

/**
 * Validate admin access and return admin wallet
 * Throws error if not admin
 */
export function requireAdmin(walletAddress: string | null | undefined): string {
  if (!isAdminWallet(walletAddress)) {
    throw new Error('Unauthorized: Admin access required')
  }

  return walletAddress!
}
