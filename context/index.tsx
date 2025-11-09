'use client'

import { wagmiAdapter, projectId } from '@/config/wagmi'
import { siwxConfig } from '@/config/siwx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, arbitrum, base } from '@reown/appkit/networks'
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

// Create the modal with SIWX authentication
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, arbitrum, base],
  defaultNetwork: mainnet,
  metadata: metadata,
  features: {
    analytics: true
  },
  siwx: siwxConfig
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
