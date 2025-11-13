'use client'

import { wagmiAdapter, projectId, getSupportedNetworks, getDefaultNetwork } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Cobbee',
  description: 'Support your favorite creators with coffee',
  url: 'https://cobbee.fun',
  icons: ['https://cobbee.fun/favicon.ico']
}

// Create the modal - Base Networks with environment switching (testnet/mainnet)
// SIWX removed - using Supabase native SIWE authentication instead
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: getSupportedNetworks(),
  defaultNetwork: getDefaultNetwork(),
  metadata: metadata,
  features: {
    analytics: true
  }
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
