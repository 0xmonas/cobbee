/**
 * x402 Payment Protocol Configuration
 *
 * This file centralizes all x402 configuration including:
 * - Network switching (testnet/mainnet)
 * - USDC contract addresses
 * - Facilitator URLs
 * - Chain configurations
 */

export type X402Network = 'base-sepolia' | 'base'

export interface X402Config {
  network: X402Network
  chainId: number
  rpcUrl: string
  usdcAddress: string
  facilitatorUrl: string
  networkName: string
}

/**
 * Get current x402 network from environment
 * Defaults to base-sepolia for safety
 */
export function getCurrentNetwork(): X402Network {
  const network = process.env.NEXT_PUBLIC_X402_NETWORK
  if (network === 'base' || network === 'base-sepolia') {
    return network
  }
  console.warn(`Invalid NEXT_PUBLIC_X402_NETWORK: ${network}, defaulting to base-sepolia`)
  return 'base-sepolia'
}

/**
 * Base Sepolia Testnet Configuration
 */
const BASE_SEPOLIA_CONFIG: X402Config = {
  network: 'base-sepolia',
  chainId: 84532,
  rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  usdcAddress: process.env.NEXT_PUBLIC_USDC_BASE_SEPOLIA || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  // Using community facilitator for Base Sepolia (testnet)
  // Coinbase CDP facilitator requires API keys
  facilitatorUrl: process.env.NEXT_PUBLIC_X402_FACILITATOR_URL || 'https://x402.org/facilitator',
  networkName: 'Base Sepolia Testnet',
}

/**
 * Base Mainnet Configuration
 */
const BASE_MAINNET_CONFIG: X402Config = {
  network: 'base',
  chainId: 8453,
  rpcUrl: process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL || 'https://mainnet.base.org',
  usdcAddress: process.env.NEXT_PUBLIC_USDC_BASE_MAINNET || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  // Using x402.rs facilitator for Base mainnet (production-ready)
  // Coinbase CDP facilitator requires API keys
  facilitatorUrl: process.env.NEXT_PUBLIC_X402_FACILITATOR_URL || 'https://facilitator.x402.rs',
  networkName: 'Base Mainnet',
}

/**
 * Get x402 configuration for current network
 */
export function getX402Config(): X402Config {
  const network = getCurrentNetwork()
  return network === 'base' ? BASE_MAINNET_CONFIG : BASE_SEPOLIA_CONFIG
}

/**
 * Get x402 configuration for specific network
 */
export function getX402ConfigForNetwork(network: X402Network): X402Config {
  return network === 'base' ? BASE_MAINNET_CONFIG : BASE_SEPOLIA_CONFIG
}

/**
 * Check if current environment is using testnet
 */
export function isTestnet(): boolean {
  return getCurrentNetwork() === 'base-sepolia'
}

/**
 * Check if current environment is using mainnet
 */
export function isMainnet(): boolean {
  return getCurrentNetwork() === 'base'
}

/**
 * Format USDC amount for display (with 6 decimals)
 */
export function formatUSDC(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return num.toFixed(2)
}

/**
 * Convert USDC amount to smallest unit (6 decimals)
 * Example: 1.5 USDC -> 1500000
 */
export function usdcToSmallestUnit(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000))
}

/**
 * Convert smallest unit to USDC (6 decimals)
 * Example: 1500000 -> 1.5 USDC
 */
export function smallestUnitToUSDC(amount: bigint): number {
  return Number(amount) / 1_000_000
}

/**
 * Trusted facilitator URLs (whitelist)
 * These are the only facilitators we trust for payment verification
 */
const TRUSTED_FACILITATORS = [
  'https://x402.org/facilitator',                      // Community facilitator
  'https://facilitator.x402.rs',                       // Production facilitator
  'https://api.developer.coinbase.com/x402',           // Coinbase CDP facilitator (docs)
  'https://api.cdp.coinbase.com/platform/v2/x402',     // Coinbase CDP facilitator (actual)
]

/**
 * Validate facilitator URL against whitelist
 * Returns true if the URL is trusted, false otherwise
 */
export function validateFacilitatorUrl(url: string): boolean {
  try {
    // Normalize URL (remove trailing slash)
    const normalizedUrl = url.replace(/\/$/, '')
    return TRUSTED_FACILITATORS.some(trusted =>
      normalizedUrl === trusted || normalizedUrl.startsWith(trusted)
    )
  } catch {
    return false
  }
}

/**
 * Get validated facilitator URL
 * Throws error if facilitator URL is not whitelisted
 */
export function getValidatedFacilitatorUrl(facilitatorUrl: string): string {
  if (!validateFacilitatorUrl(facilitatorUrl)) {
    console.error('[x402] Untrusted facilitator URL:', facilitatorUrl)
    throw new Error(
      `Untrusted facilitator URL: ${facilitatorUrl}. Only whitelisted facilitators are allowed.`
    )
  }
  return facilitatorUrl
}
