import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, baseSepolia, type AppKitNetwork } from '@reown/appkit/networks'

// Get projectId from environment
export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('Project ID is not defined')
}

/**
 * Get network configuration based on environment variable
 * Defaults to Base Sepolia (testnet) for safety
 */
export function getNetwork(): AppKitNetwork {
  const networkEnv = process.env.NEXT_PUBLIC_X402_NETWORK

  if (networkEnv === 'base') {
    return base // Mainnet
  }

  return baseSepolia // Testnet (default)
}

/**
 * All supported networks
 * Always include both testnet and mainnet for flexibility
 */
export const supportedNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [baseSepolia, base]

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): [AppKitNetwork, ...AppKitNetwork[]] {
  return supportedNetworks
}

/**
 * Get default network (the one to connect to initially)
 */
export function getDefaultNetwork(): AppKitNetwork {
  return getNetwork()
}

// Set up the Wagmi Adapter (Config) - Base Networks with environment switching
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks: supportedNetworks
})

export const config = wagmiAdapter.wagmiConfig
