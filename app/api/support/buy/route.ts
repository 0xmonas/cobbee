import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSupporterName, validateSupportMessage } from '@/lib/utils/validation'
import { getX402Config, usdcToSmallestUnit, smallestUnitToUSDC } from '@/lib/x402-config'

/**
 * x402 Payment Protocol Endpoint
 *
 * POST /api/support/buy
 *
 * This endpoint implements the x402 payment protocol flow:
 * 1. First request (no payment): Returns 402 Payment Required with payment instructions
 * 2. Second request (with x-payment header): Verifies payment and creates support
 *
 * Flow:
 * - Buyer sends request with coffee details
 * - Server responds with 402 + payment instructions (amount, recipient wallet)
 * - Buyer's x402-fetch client automatically handles payment
 * - Buyer retries request with x-payment header containing proof
 * - Server verifies payment via Facilitator
 * - Server creates support record and returns success
 */

interface SupportBuyRequest {
  creator_id: string
  supporter_name: string
  coffee_count: number
  message?: string
  is_private?: boolean
}

interface X402PaymentInstructions {
  amount: string // Amount in smallest unit (e.g., "1000000" for 1 USDC)
  currency: string // "USDC"
  recipient: string // Creator's wallet address
  network: string // "base-sepolia" or "base"
  chainId: number
  tokenAddress: string // USDC contract address
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const x402Config = getX402Config()

    // Parse request body
    const body: SupportBuyRequest = await request.json()
    const { creator_id, supporter_name, coffee_count, message, is_private } = body

    // =========================================================================
    // VALIDATION - Common to both requests
    // =========================================================================

    // Validate required fields
    if (!creator_id) {
      return Response.json(
        { error: 'Creator ID is required', field: 'creator_id' },
        { status: 400 }
      )
    }

    // Validate supporter name
    const nameError = validateSupporterName(supporter_name)
    if (nameError) {
      return Response.json(
        { error: nameError, field: 'supporter_name' },
        { status: 400 }
      )
    }

    // Validate coffee count
    if (!coffee_count || coffee_count < 1 || coffee_count > 100) {
      return Response.json(
        { error: 'Coffee count must be between 1 and 100', field: 'coffee_count' },
        { status: 400 }
      )
    }

    // Validate message (if provided)
    if (message) {
      const messageError = validateSupportMessage(message)
      if (messageError) {
        return Response.json(
          { error: messageError, field: 'message' },
          { status: 400 }
        )
      }
    }

    // Fetch creator details (including wallet and coffee price)
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, display_name, wallet_address, coffee_price')
      .eq('id', creator_id)
      .single()

    if (creatorError || !creator) {
      return Response.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    if (!creator.wallet_address) {
      return Response.json(
        { error: 'Creator has not set up their wallet yet' },
        { status: 400 }
      )
    }

    // Calculate total amount (creator's coffee_price × coffee_count)
    const coffeePrice = creator.coffee_price || 1.0 // Default to 1 USDC if not set
    const totalAmount = coffeePrice * coffee_count
    const totalAmountSmallestUnit = usdcToSmallestUnit(totalAmount)

    // =========================================================================
    // CHECK FOR x-payment HEADER
    // =========================================================================

    const paymentHeader = request.headers.get('x-payment')

    if (!paymentHeader) {
      // -----------------------------------------------------------------------
      // FIRST REQUEST (No payment yet)
      // Return 402 Payment Required with payment instructions
      // -----------------------------------------------------------------------

      const paymentInstructions: X402PaymentInstructions = {
        amount: totalAmountSmallestUnit.toString(),
        currency: 'USDC',
        recipient: creator.wallet_address,
        network: x402Config.network,
        chainId: x402Config.chainId,
        tokenAddress: x402Config.usdcAddress,
      }

      return Response.json(
        {
          error: 'Payment Required',
          message: `Buy ${coffee_count} coffee${coffee_count > 1 ? 's' : ''} for ${creator.display_name}`,
          payment: paymentInstructions,
        },
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Required': 'true',
            'X-Payment-Amount': totalAmountSmallestUnit.toString(),
            'X-Payment-Currency': 'USDC',
            'X-Payment-Recipient': creator.wallet_address,
            'X-Payment-Network': x402Config.network,
            'X-Payment-ChainId': x402Config.chainId.toString(),
            'X-Payment-Token': x402Config.usdcAddress,
          },
        }
      )
    }

    // =========================================================================
    // SECOND REQUEST (With x-payment header)
    // Verify payment and create support record
    // =========================================================================

    try {
      // Parse payment proof from header
      const paymentProof = JSON.parse(paymentHeader)

      // Verify payment via Facilitator
      const facilitatorResponse = await fetch(`${x402Config.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment: paymentProof,
          expectedAmount: totalAmountSmallestUnit.toString(),
          expectedRecipient: creator.wallet_address,
          expectedToken: x402Config.usdcAddress,
          expectedNetwork: x402Config.network,
        }),
      })

      if (!facilitatorResponse.ok) {
        const errorData = await facilitatorResponse.json().catch(() => ({}))
        console.error('Facilitator verification failed:', errorData)
        return Response.json(
          {
            error: 'Payment verification failed',
            details: errorData.error || 'Invalid payment proof',
          },
          { status: 402 }
        )
      }

      const verificationResult = await facilitatorResponse.json()

      if (!verificationResult.verified) {
        return Response.json(
          {
            error: 'Payment verification failed',
            details: 'Payment could not be verified',
          },
          { status: 402 }
        )
      }

      // Extract transaction details from verification result
      const transactionHash = verificationResult.transactionHash || paymentProof.transactionHash
      const supporterWalletAddress = verificationResult.from || paymentProof.from

      if (!supporterWalletAddress) {
        return Response.json(
          {
            error: 'Invalid payment',
            details: 'Could not determine sender wallet address',
          },
          { status: 400 }
        )
      }

      // -----------------------------------------------------------------------
      // Create support record in database
      // -----------------------------------------------------------------------

      const { data: support, error: insertError } = await supabase
        .from('supports')
        .insert({
          creator_id,
          supporter_name: supporter_name.trim(),
          supporter_wallet_address: supporterWalletAddress,
          coffee_count,
          message: message?.trim() || null,
          is_private: is_private || false,
          is_hidden: false,
          total_amount: totalAmount,
          transaction_hash: transactionHash,
          status: 'confirmed', // Payment verified, mark as confirmed
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        console.error('Failed to create support:', insertError)
        return Response.json(
          { error: 'Failed to create support record. Please contact support.' },
          { status: 500 }
        )
      }

      // Success! Return support details with payment response header
      return Response.json(
        {
          success: true,
          message: `Successfully bought ${coffee_count} coffee${coffee_count > 1 ? 's' : ''} for ${creator.display_name}!`,
          support,
          payment: {
            transactionHash,
            amount: totalAmount,
            currency: 'USDC',
            network: x402Config.network,
          },
        },
        {
          status: 200,
          headers: {
            'X-Payment-Response': JSON.stringify({
              verified: true,
              transactionHash,
              amount: totalAmount,
              network: x402Config.network,
            }),
          },
        }
      )
    } catch (parseError) {
      console.error('Failed to parse payment header:', parseError)
      return Response.json(
        {
          error: 'Invalid payment header',
          details: 'Could not parse x-payment header',
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Support buy error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process support' },
      { status: 500 }
    )
  }
}
