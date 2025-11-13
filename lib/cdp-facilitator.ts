/**
 * CDP Facilitator Configuration
 *
 * This module provides the Coinbase Developer Platform (CDP) facilitator
 * for x402 payment verification and settlement.
 */

import { facilitator as cdpFacilitator } from '@coinbase/x402'

/**
 * Get CDP facilitator instance
 * Requires CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables
 */
export function getCDPFacilitator() {
  const apiKeyId = process.env.CDP_API_KEY_ID
  const apiKeySecret = process.env.CDP_API_KEY_SECRET

  if (!apiKeyId || !apiKeySecret) {
    console.warn('[CDP] API keys not configured, facilitator will not be available')
    return null
  }

  return cdpFacilitator
}

/**
 * Check if CDP facilitator is configured
 */
export function isCDPFacilitatorConfigured(): boolean {
  return !!(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET)
}
