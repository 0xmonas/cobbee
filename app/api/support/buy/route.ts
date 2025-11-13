import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSupporterName, validateSupportMessage } from '@/lib/utils/validation'
import { getX402Config, usdcToSmallestUnit } from '@/lib/x402-config'

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
    // CHECK FOR X-PAYMENT HEADER (x402 protocol uses uppercase)
    // =========================================================================

    const paymentHeader = request.headers.get('X-PAYMENT') || request.headers.get('x-payment')

    if (!paymentHeader) {
      // -----------------------------------------------------------------------
      // FIRST REQUEST (No payment yet)
      // Return 402 Payment Required with x402 protocol format
      // -----------------------------------------------------------------------

      // Construct the resource URL (the current request URL)
      const resourceUrl = new URL(request.url)

      return Response.json(
        {
          x402Version: 1,
          error: 'payment-required',
          accepts: [
            {
              scheme: 'exact',
              network: x402Config.network,
              maxAmountRequired: totalAmountSmallestUnit.toString(),
              resource: resourceUrl.toString(),
              description: `Buy ${coffee_count} coffee${coffee_count > 1 ? 's' : ''} for ${creator.display_name}`,
              mimeType: 'application/json',
              outputSchema: null, // Optional: JSON schema for response
              payTo: creator.wallet_address,
              maxTimeoutSeconds: 300, // 5 minutes
              asset: x402Config.usdcAddress,
              extra: {
                // EIP-3009 metadata for USDC token
                name: 'USD Coin',
                version: '2',
              },
            },
          ],
        },
        {
          status: 402,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // =========================================================================
    // SECOND REQUEST (With x-payment header)
    // Verify payment and create support record
    // =========================================================================

    try {
      // Construct the resource URL (for paymentRequirements)
      const resourceUrl = new URL(request.url)

      // Build paymentRequirements object matching the 402 response
      const paymentRequirements = {
        scheme: 'exact',
        network: x402Config.network,
        maxAmountRequired: totalAmountSmallestUnit.toString(),
        resource: resourceUrl.toString(),
        description: `Buy ${coffee_count} coffee${coffee_count > 1 ? 's' : ''} for ${creator.display_name}`,
        mimeType: 'application/json',
        outputSchema: null,
        payTo: creator.wallet_address,
        maxTimeoutSeconds: 300,
        asset: x402Config.usdcAddress,
        extra: {
          name: 'USD Coin',
          version: '2',
        },
      }

      // Verify payment via Facilitator using x402 protocol format
      console.log('[x402] Verifying payment:', {
        network: x402Config.network,
        amount: totalAmountSmallestUnit.toString(),
        recipient: creator.wallet_address,
        facilitator: x402Config.facilitatorUrl,
      })

      const facilitatorResponse = await fetch(`${x402Config.facilitatorUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x402Version: 1,
          paymentHeader: paymentHeader, // Raw X-PAYMENT header string
          paymentRequirements: paymentRequirements,
        }),
      })

      if (!facilitatorResponse.ok) {
        const errorData = await facilitatorResponse.json().catch(() => ({}))
        console.error('Facilitator verification failed:', errorData)
        return Response.json(
          {
            error: 'Payment verification failed',
            details: errorData.error || errorData.invalidReason || 'Invalid payment proof',
          },
          { status: 402 }
        )
      }

      const verificationResult = await facilitatorResponse.json()
      console.log('[x402] Verification result:', verificationResult)

      // Protocol uses 'isValid' not 'verified'
      if (!verificationResult.isValid) {
        return Response.json(
          {
            error: 'Payment verification failed',
            details: verificationResult.invalidReason || 'Payment could not be verified',
          },
          { status: 402 }
        )
      }

      // Extract payer address from verification result
      const paymentPayload = JSON.parse(paymentHeader)
      const supporterWalletAddress = verificationResult.payer || paymentPayload.payload?.authorization?.from

      console.log('[x402] Payment verified:', {
        payer: supporterWalletAddress,
        network: paymentPayload.network,
        scheme: paymentPayload.scheme,
      })

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
      // Settle payment to get transaction hash
      // For "exact" scheme, the facilitator watches the blockchain and returns
      // the transaction hash once the payment is confirmed on-chain
      // -----------------------------------------------------------------------
      const settlementResponse = await fetch(`${x402Config.facilitatorUrl}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          x402Version: 1,
          paymentHeader: paymentHeader,
          paymentRequirements: paymentRequirements,
        }),
      })

      if (!settlementResponse.ok) {
        const errorData = await settlementResponse.json().catch(() => ({}))
        console.error('[x402] Settlement failed:', errorData)
        return Response.json(
          {
            error: 'Payment settlement failed',
            details: errorData.error || 'Could not settle payment on-chain',
          },
          { status: 402 }
        )
      }

      const settlementResult = await settlementResponse.json()
      console.log('[x402] Settlement result:', settlementResult)

      if (!settlementResult.success) {
        return Response.json(
          {
            error: 'Payment settlement failed',
            details: settlementResult.error || 'Settlement was not successful',
          },
          { status: 402 }
        )
      }

      // Extract transaction hash from settlement result
      const transactionHash = settlementResult.txHash || settlementResult.transaction

      if (!transactionHash) {
        console.warn('[x402] No transaction hash returned from settlement')
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
