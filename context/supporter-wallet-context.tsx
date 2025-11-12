'use client'

import { createAppKit } from '@reown/appkit/react'
import { base } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { cookieStorage, createStorage } from '@wagmi/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type Config } from 'wagmi'
import React, { type ReactNode } from 'react'

// Supporter için ayrı QueryClient
const supporterQueryClient = new QueryClient()

// Environment'tan project ID al
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('WalletConnect Project ID is not defined')
}

// Supporter için ayrı Wagmi Adapter
const supporterWagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks: [base]
})

// Supporter için ayrı metadata
const supporterMetadata = {
  name: 'Cobbee - Support Creator',
  description: 'Connect your wallet to support creators',
  url: 'https://cobbee.fun',
  icons: ['https://cobbee.fun/favicon.ico']
}

// Supporter için ayrı AppKit modal (modal ID farklı olmalı)
const supporterAppKit = createAppKit({
  adapters: [supporterWagmiAdapter],
  projectId,
  networks: [base],
  defaultNetwork: base,
  metadata: supporterMetadata,
  features: {
    analytics: false // Supporter için analytics kapalı
  },
  // Farklı modal ID ile ayrı instance
  themeMode: 'light',
  themeVariables: {
    '--w3m-z-index': '9999' // Creator modal'ından daha üstte
  }
})

interface SupporterWalletProviderProps {
  children: ReactNode
}

export function SupporterWalletProvider({ children }: SupporterWalletProviderProps) {
  return (
    <WagmiProvider config={supporterWagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={supporterQueryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Export the AppKit instance for use in components
export { supporterAppKit }
