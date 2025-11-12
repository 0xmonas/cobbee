import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils/validation'

/**
 * Email Change/Add Request API
 *
 * POST /api/user/email/send-change-request
 *
 * Handles both adding email (if user has none) and changing email (if user has one)
 * - Add: Sends verification link to new email
 * - Change: Sends confirmation link to new email + security notification to current email
 * Requires authentication
 * User must click the link to complete the action
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
    const { newEmail } = body

    if (!newEmail) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Server-side email validation
    const emailError = validateEmail(newEmail)
    if (emailError) {
      return Response.json(
        { error: emailError },
        { status: 400 }
      )
    }

    // Get current user data
    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    const hasEmail = !!currentUser?.email

    // If user already has an email, check if new email is same as current
    if (hasEmail && currentUser.email === newEmail) {
      return Response.json(
        { error: 'This is already your current email address' },
        { status: 400 }
      )
    }

    // Check if email is already used by another user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .single()

    if (existingUser && existingUser.id !== user.id) {
      return Response.json(
        { error: 'This email is already in use by another account' },
        { status: 409 }
      )
    }

    // ✅ SECURE: Send confirmation to NEW email
    // Supabase automatically:
    // 1. Sends confirmation link to NEW email (user must click)
    // 2. Sends security notification to CURRENT email
    // 3. Only changes email after NEW email is confirmed
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (updateError) {
      console.error('Failed to send confirmation:', updateError)

      // Handle specific Supabase errors
      if (updateError.message.includes('already') || updateError.message.includes('exists')) {
        return Response.json(
          { error: 'This email is already in use by another account' },
          { status: 409 }
        )
      }

      return Response.json(
        { error: updateError.message || 'Failed to send confirmation' },
        { status: 500 }
      )
    }

    console.log('Email change confirmation sent to:', newEmail)

    return Response.json({
      success: true,
      message: hasEmail
        ? 'Please check your new email and click the confirmation link'
        : 'Please check your email and click the verification link',
      currentEmail: currentUser?.email || null,
      newEmail,
      requiresConfirmation: true,
      isAddingEmail: !hasEmail
    }, { status: 200 })

  } catch (error) {
    console.error('Send email change request error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to send confirmation' },
      { status: 500 }
    )
  }
}
