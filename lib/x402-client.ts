/**
 * x402 Client Integration
 *
 * This file provides utilities for integrating x402 payment protocol
 * with Reown AppKit wallet connection.
 */

import { wrapFetchWithPayment, decodeXPaymentResponse } from 'x402-fetch'
import { type WalletClient, createWalletClient, custom } from 'viem'
import { getX402Config } from './x402-config'

/**
 * Create a viem wallet client from window.ethereum provider
 * This is used by x402-fetch to sign transactions
 */
export function createViemWalletClient(address: `0x${string}`): WalletClient | null {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.error('window.ethereum not available')
    return null
  }

  try {
    const x402Config = getX402Config()

    const walletClient = createWalletClient({
      account: address,
      chain: {
        id: x402Config.chainId,
        name: x402Config.networkName,
        network: x402Config.network,
        nativeCurrency: {
          decimals: 18,
          name: 'Ether',
          symbol: 'ETH',
        },
        rpcUrls: {
          default: { http: [x402Config.rpcUrl] },
          public: { http: [x402Config.rpcUrl] },
        },
      },
      transport: custom(window.ethereum),
    })

    return walletClient
  } catch (error) {
    console.error('Failed to create wallet client:', error)
    return null
  }
}

/**
 * Create x402-enabled fetch function with wallet
 * @param address - Wallet address
 * @param maxValue - Maximum payment amount in smallest units (default: 100 USDC = 100,000,000)
 */
export function createX402Fetch(address: `0x${string}`, maxValue?: bigint) {
  const walletClient = createViemWalletClient(address)

  if (!walletClient) {
    throw new Error('Failed to create wallet client')
  }

  // Default to 100 USDC (100 * 10^6 = 100,000,000 smallest units)
  // This allows for reasonable coffee purchases (1-100 coffees at ~$1 each)
  const maxPaymentValue = maxValue ?? BigInt(100 * 10 ** 6)

  return wrapFetchWithPayment(fetch, walletClient, maxPaymentValue)
}

/**
 * Make a paid request using x402 protocol
 */
export async function makeX402Request<T = any>(
  url: string,
  address: `0x${string}`,
  options?: RequestInit
): Promise<{
  data: T
  payment?: {
    verified: boolean
    transactionHash: string
    amount: number
    network: string
  }
}> {
  const x402Fetch = createX402Fetch(address)

  const response = await x402Fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  const data = await response.json()

  // Decode payment response from headers
  const paymentResponseHeader = response.headers.get('x-payment-response')
  let payment = undefined

  if (paymentResponseHeader) {
    try {
      payment = decodeXPaymentResponse(paymentResponseHeader)
    } catch (error) {
      console.warn('Failed to decode payment response:', error)
    }
  }

  return { data, payment }
}
