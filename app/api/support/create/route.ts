import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateSupporterName, validateSupportMessage } from '@/lib/utils/validation'

/**
 * Support Creation API
 *
 * POST /api/support/create
 *
 * Creates a new support record (coffee donation)
 * Does NOT require authentication (supporters can be anonymous)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Parse request body
    const body = await request.json()
    const {
      creator_id,
      supporter_name,
      supporter_wallet_address,
      coffee_count,
      message,
      is_private,
      total_amount,
      transaction_hash
    } = body

    // Validate required fields
    if (!creator_id) {
      return Response.json(
        { error: 'Creator ID is required', field: 'creator_id' },
        { status: 400 }
      )
    }

    if (!supporter_wallet_address) {
      return Response.json(
        { error: 'Wallet address is required', field: 'supporter_wallet_address' },
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

    // Validate coffee count
    if (!coffee_count || coffee_count < 1 || coffee_count > 100) {
      return Response.json(
        { error: 'Coffee count must be between 1 and 100', field: 'coffee_count' },
        { status: 400 }
      )
    }

    // Validate total amount
    if (!total_amount || total_amount <= 0) {
      return Response.json(
        { error: 'Total amount must be greater than 0', field: 'total_amount' },
        { status: 400 }
      )
    }

    // Check if creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id, display_name')
      .eq('id', creator_id)
      .single()

    if (creatorError || !creator) {
      return Response.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Insert support record into database
    const { data: support, error: insertError } = await supabase
      .from('supports')
      .insert({
        creator_id,
        supporter_name: supporter_name.trim(),
        supporter_wallet_address,
        coffee_count,
        message: message?.trim() || null,
        is_private: is_private || false,
        is_hidden: false,
        total_amount,
        transaction_hash: transaction_hash || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create support:', insertError)
      return Response.json(
        { error: 'Failed to create support. Please try again.' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Support created successfully!',
      support
    }, { status: 201 })

  } catch (error) {
    console.error('Create support error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create support' },
      { status: 500 }
    )
  }
}
