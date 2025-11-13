/**
 * CDP Facilitator Configuration
 *
 * This module provides the Coinbase Developer Platform (CDP) facilitator
 * for x402 payment verification and settlement.
 */

import { createFacilitatorConfig } from '@coinbase/x402'

/**
 * Get CDP facilitator instance
 * Requires CDP_API_KEY_ID and CDP_API_KEY_SECRET environment variables
 *
 * The @coinbase/x402 SDK provides a facilitator object that handles
 * authentication and API requests internally. We can either:
 * 1. Use the default `facilitator` (reads from env vars)
 * 2. Create a custom config with `createFacilitatorConfig(keyId, keySecret)`
 */
export function getCDPFacilitator() {
  const apiKeyId = process.env.CDP_API_KEY_ID
  const apiKeySecret = process.env.CDP_API_KEY_SECRET

  if (!apiKeyId || !apiKeySecret) {
    console.warn('[CDP] API keys not configured, facilitator will not be available')
    return null
  }

  // Create facilitator config with explicit credentials
  // This is more reliable than relying on environment variables being set correctly
  return createFacilitatorConfig(apiKeyId, apiKeySecret)
}

/**
 * Check if CDP facilitator is configured
 */
export function isCDPFacilitatorConfigured(): boolean {
  return !!(process.env.CDP_API_KEY_ID && process.env.CDP_API_KEY_SECRET)
}
