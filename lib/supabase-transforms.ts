/**
 * Supabase Transform Utilities
 * Converts between database schema (snake_case) and frontend types (camelCase)
 */

import type { Creator, Support } from './mock-data'
import { getAvatarUrl } from './avatar-utils'

// ============================================================================
// DATABASE TYPES (snake_case - matches Supabase schema)
// ============================================================================

export interface DBUser {
  id: string
  wallet_address: string
  email: string
  email_verified: boolean
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  cover_image_url: string | null
  twitter_handle: string | null
  instagram_handle: string | null
  github_handle: string | null
  tiktok_handle: string | null
  opensea_handle: string | null
  coffee_price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DBSupport {
  id: string
  creator_id: string
  supporter_name: string
  supporter_wallet_address: string
  supporter_avatar_url: string | null
  coffee_count: number
  coffee_price_at_time: number
  total_amount: number
  currency: string
  tx_hash: string
  chain_id: number
  message: string | null
  is_message_private: boolean
  is_hidden_by_creator: boolean
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  confirmed_at: string | null
}

export interface DBCreatorStats {
  id: string
  username: string
  display_name: string
  total_supports: number
  total_supporters: number
  total_earnings: number
  monthly_supports: number
  monthly_earnings: number
}

// ============================================================================
// TRANSFORM: Database → Frontend
// ============================================================================

/**
 * Transforms database user to Creator type
 * @param dbUser - User from database
 * @param stats - Optional stats from creator_dashboard_stats view
 * @returns Creator object
 */
export function transformUserToCreator(
  dbUser: DBUser,
  stats?: Pick<DBCreatorStats, 'total_supports'>
): Creator {
  return {
    id: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.display_name,
    bio: dbUser.bio || '',
    avatar: dbUser.avatar_url || '/placeholder.svg',
    coverImage: dbUser.cover_image_url || '/placeholder.svg',
    totalSupports: stats?.total_supports ?? 0,
    coffeePrice: dbUser.coffee_price,
    walletAddress: dbUser.wallet_address,
    socialMedia: {
      twitter: dbUser.twitter_handle || undefined,
      instagram: dbUser.instagram_handle || undefined,
      github: dbUser.github_handle || undefined,
      tiktok: dbUser.tiktok_handle || undefined,
      opensea: dbUser.opensea_handle || undefined,
    },
  }
}

/**
 * Transforms database support to Support type
 * @param dbSupport - Support from database
 * @returns Support object
 */
export function transformSupportToSupport(dbSupport: DBSupport): Support {
  return {
    id: dbSupport.id,
    supporterName: dbSupport.supporter_name,
    // Generate avatar from initials if no avatar URL
    supporterAvatar: getAvatarUrl(dbSupport.supporter_avatar_url, dbSupport.supporter_name),
    coffeeCount: dbSupport.coffee_count,
    message: dbSupport.message || '',
    // Convert TIMESTAMPTZ to relative time (will be calculated in component)
    timestamp: dbSupport.created_at,
    amount: dbSupport.total_amount,
    txHash: dbSupport.tx_hash,
    isPrivate: dbSupport.is_message_private,
    isHidden: dbSupport.is_hidden_by_creator,
  }
}

// ============================================================================
// TRANSFORM: Frontend → Database
// ============================================================================

/**
 * Prepares creator data for database insert/update
 * @param creator - Creator data from form
 * @returns Database-ready object
 */
export function prepareCreatorForDB(creator: Partial<Creator> & { walletAddress: string; email: string }) {
  return {
    wallet_address: creator.walletAddress,
    email: creator.email,
    username: creator.username!,
    display_name: creator.displayName!,
    bio: creator.bio || null,
    avatar_url: creator.avatar || null,
    cover_image_url: creator.coverImage || null,
    twitter_handle: creator.socialMedia?.twitter || null,
    instagram_handle: creator.socialMedia?.instagram || null,
    github_handle: creator.socialMedia?.github || null,
    tiktok_handle: creator.socialMedia?.tiktok || null,
    opensea_handle: creator.socialMedia?.opensea || null,
    coffee_price: creator.coffeePrice ?? 5.0,
  }
}

/**
 * Prepares support data for database insert
 * @param support - Support data from form
 * @returns Database-ready object
 */
export function prepareSupportForDB(support: {
  creatorId: string
  supporterName: string
  supporterWallet: string
  coffeeCount: number
  message?: string
  isPrivate?: boolean
  txHash: string
  chainId: number
  coffeePriceAtTime: number
}) {
  return {
    creator_id: support.creatorId,
    supporter_name: support.supporterName,
    supporter_wallet_address: support.supporterWallet,
    supporter_avatar_url: null, // Will be generated
    coffee_count: support.coffeeCount,
    coffee_price_at_time: support.coffeePriceAtTime,
    total_amount: support.coffeeCount * support.coffeePriceAtTime,
    currency: 'USD',
    tx_hash: support.txHash,
    chain_id: support.chainId,
    message: support.message || null,
    is_message_private: support.isPrivate ?? false,
    status: 'pending' as const,
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Converts relative time string to ISO timestamp (for mock data migration)
 * @param relativeTime - "2 hours ago", "1 day ago", etc.
 * @returns ISO timestamp string
 */
export function relativeTimeToISO(relativeTime: string): string {
  const now = new Date()

  const match = relativeTime.match(/(\d+)\s+(minute|hour|day|week)s?\s+ago/)
  if (!match) return now.toISOString()

  const [, amount, unit] = match
  const value = parseInt(amount, 10)

  switch (unit) {
    case 'minute':
      now.setMinutes(now.getMinutes() - value)
      break
    case 'hour':
      now.setHours(now.getHours() - value)
      break
    case 'day':
      now.setDate(now.getDate() - value)
      break
    case 'week':
      now.setDate(now.getDate() - value * 7)
      break
  }

  return now.toISOString()
}

/**
 * Converts ISO timestamp to relative time string
 * @param isoTimestamp - ISO timestamp string
 * @returns Relative time string ("2 hours ago")
 */
export function isoToRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  const diffWeeks = Math.floor(diffDays / 7)
  return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`
}
