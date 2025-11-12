import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCoffeePrice, validateThankYouMessage } from '@/lib/utils/validation'

/**
 * Payment Settings Update API
 *
 * POST /api/user/payment-settings
 *
 * Updates coffee price and thank you message
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { coffeePrice, thankYouMessage } = body

    // Validate coffee price
    const priceError = validateCoffeePrice(coffeePrice)
    if (priceError) {
      return Response.json(
        { error: priceError, field: 'coffeePrice' },
        { status: 400 }
      )
    }

    // Validate thank you message
    const messageError = validateThankYouMessage(thankYouMessage)
    if (messageError) {
      return Response.json(
        { error: messageError, field: 'thankYouMessage' },
        { status: 400 }
      )
    }

    // Convert price to number
    const numPrice = typeof coffeePrice === 'string' ? parseFloat(coffeePrice) : coffeePrice

    // Update user settings in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        coffee_price: numPrice,
        thank_you_message: thankYouMessage?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update payment settings:', updateError)
      return Response.json(
        { error: 'Failed to update payment settings. Please try again.' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Payment settings updated successfully!',
      user: updatedUser
    }, { status: 200 })

  } catch (error) {
    console.error('Update payment settings error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update payment settings' },
      { status: 500 }
    )
  }
}
