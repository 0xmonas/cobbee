import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSupporterName, validateSupportMessage } from '@/lib/utils/validation'
import { getX402Config, usdcToSmallestUnit } from '@/lib/x402-config'
import { getCDPFacilitator, isCDPFacilitatorConfigured } from '@/lib/cdp-facilitator'

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

    // Get facilitator configuration (CDP if available, otherwise fallback)
    const cdpFacilitator = getCDPFacilitator()
    const facilitatorUrl = cdpFacilitator?.url || x402Config.facilitatorUrl

    console.log('[x402] Using facilitator:', {
      type: cdpFacilitator ? 'CDP (authenticated)' : 'Community',
      url: facilitatorUrl,
    })

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
      // Log the payment header for debugging
      console.log('[x402] Payment header received:', {
        headerLength: paymentHeader.length,
        headerPreview: paymentHeader.substring(0, 100),
      })

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
        facilitator: facilitatorUrl,
      })

      // Prepare headers for facilitator request
      const facilitatorHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Get CDP authentication headers if configured
      if (cdpFacilitator && cdpFacilitator.createAuthHeaders) {
        const authHeaders = await cdpFacilitator.createAuthHeaders()
        // Merge verify endpoint headers (includes Authorization and Correlation-Context)
        Object.assign(facilitatorHeaders, authHeaders.verify)
        console.log('[x402] Using CDP authentication headers:', {
          hasAuthorization: !!authHeaders.verify.Authorization,
          hasCorrelation: !!authHeaders.verify['Correlation-Context'],
        })
      }

      let facilitatorResponse
      try {
        facilitatorResponse = await fetch(`${facilitatorUrl}/verify`, {
          method: 'POST',
          headers: facilitatorHeaders,
          body: JSON.stringify({
            x402Version: 1,
            paymentHeader: paymentHeader, // Raw X-PAYMENT header string
            paymentRequirements: paymentRequirements,
          }),
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })
      } catch (fetchError) {
        console.error('[x402] Facilitator fetch failed:', {
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          facilitatorUrl: facilitatorUrl,
          network: x402Config.network,
        })
        return Response.json(
          {
            error: 'Facilitator connection failed',
            details: `Could not connect to payment facilitator: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          },
          { status: 502 }
        )
      }

      if (!facilitatorResponse.ok) {
        const errorText = await facilitatorResponse.text()
        console.error('[x402] Facilitator verification failed:', {
          status: facilitatorResponse.status,
          statusText: facilitatorResponse.statusText,
          headers: Object.fromEntries(facilitatorResponse.headers.entries()),
          body: errorText,
        })

        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { rawError: errorText }
        }

        return Response.json(
          {
            error: 'Payment verification failed',
            details: errorData.error || errorData.message || errorData.invalidReason || 'Invalid payment proof',
            debug: {
              status: facilitatorResponse.status,
              response: errorData,
            },
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
      let paymentPayload
      try {
        paymentPayload = JSON.parse(paymentHeader)
        console.log('[x402] Payment payload parsed:', {
          scheme: paymentPayload.scheme,
          network: paymentPayload.network,
          hasPayload: !!paymentPayload.payload,
        })
      } catch (parseError) {
        console.error('[x402] Failed to parse payment header:', parseError)
        console.error('[x402] Payment header content:', paymentHeader)
        throw new Error('Invalid payment header format')
      }

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

      // Get settle endpoint headers (regenerate in case of JWT expiry)
      const settlementHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (cdpFacilitator && cdpFacilitator.createAuthHeaders) {
        const authHeaders = await cdpFacilitator.createAuthHeaders()
        Object.assign(settlementHeaders, authHeaders.settle)
      }

      let settlementResponse
      try {
        settlementResponse = await fetch(`${facilitatorUrl}/settle`, {
          method: 'POST',
          headers: settlementHeaders,
          body: JSON.stringify({
            x402Version: 1,
            paymentHeader: paymentHeader,
            paymentRequirements: paymentRequirements,
          }),
          signal: AbortSignal.timeout(30000), // 30 second timeout for settlement
        })
      } catch (fetchError) {
        console.error('[x402] Settlement fetch failed:', {
          error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          facilitatorUrl: facilitatorUrl,
        })
        return Response.json(
          {
            error: 'Settlement connection failed',
            details: `Could not connect to facilitator for settlement: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          },
          { status: 502 }
        )
      }

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
      console.error('[x402] Payment processing error:', parseError)
      if (parseError instanceof Error) {
        console.error('[x402] Error details:', {
          message: parseError.message,
          stack: parseError.stack,
        })
      }
      return Response.json(
        {
          error: 'Invalid payment header',
          details: parseError instanceof Error ? parseError.message : 'Could not parse x-payment header',
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
