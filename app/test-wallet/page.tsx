'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect } from 'wagmi'

export default function TestWalletPage() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-8">Wallet Connection Test</h1>

        <div className="bg-gray-50 border-4 border-black rounded-2xl p-6 mb-4">
          <h2 className="text-2xl font-black mb-4">Connection Status</h2>

          {isConnected ? (
            <div className="bg-green-100 border-4 border-green-600 rounded-xl p-4">
              <p className="font-bold text-green-600">✅ Wallet Connected!</p>
              <p className="text-sm font-mono mt-2 text-green-800 break-all">
                Address: {address}
              </p>
              <button
                onClick={() => disconnect()}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="bg-yellow-100 border-4 border-yellow-600 rounded-xl p-4">
              <p className="font-bold text-yellow-600">⚠️ Not Connected</p>
              <button
                onClick={() => open()}
                className="mt-4 bg-[#0000FF] hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        <div className="bg-[#CCFF00] border-4 border-black rounded-2xl p-6">
          <h2 className="text-2xl font-black mb-4">Configuration Check</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold">WalletConnect Project ID:</span>
              <code className="bg-black text-[#CCFF00] px-2 py-1 rounded font-mono text-sm">
                {process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? '✅ Set' : '❌ Not Set'}
              </code>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border-4 border-blue-600 rounded-xl">
          <p className="font-bold text-blue-900">
            💡 Tip: Click "Connect Wallet" to test the Reown AppKit integration with WalletConnect!
          </p>
        </div>
      </div>
    </div>
  )
}
