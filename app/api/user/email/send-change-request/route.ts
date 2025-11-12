import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils/validation'
import { generateOTP, getOTPExpiry, hashOTP, sendOtpEmail, sendSecurityNotification } from '@/lib/email'

/**
 * Email Change Request API (Custom OTP with Resend)
 *
 * POST /api/user/email/send-change-request
 *
 * Sends OTP to NEW email for verification
 * Sends security notification to CURRENT email
 * Requires authentication
 * User must verify OTP via /api/user/email/verify-change-otp to complete
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

    // User must have email to change it
    if (!hasEmail) {
      return Response.json(
        { error: 'You must add an email first before changing it' },
        { status: 400 }
      )
    }

    // Check if new email is same as current
    if (currentUser.email === newEmail) {
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

    // Delete any existing unverified OTP for this user (cleanup old attempts)
    await supabase
      .from('email_verifications')
      .delete()
      .eq('user_id', user.id)
      .eq('verified', false)

    // Generate custom OTP code
    const otpCode = generateOTP()
    const expiresAt = getOTPExpiry()
    const hashedOTP = await hashOTP(otpCode)

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('email_verifications')
      .insert({
        user_id: user.id,
        email: newEmail,
        otp_code: hashedOTP,
        expires_at: expiresAt.toISOString(),
        verified: false,
      })

    if (dbError) {
      console.error('Failed to store OTP:', dbError)
      return Response.json(
        { error: 'Failed to generate verification code. Please try again.' },
        { status: 500 }
      )
    }

    // Send OTP to NEW email via Resend
    try {
      await sendOtpEmail(newEmail, otpCode)
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)

      // Clean up database entry if email fails
      await supabase
        .from('email_verifications')
        .delete()
        .eq('user_id', user.id)
        .eq('email', newEmail)
        .eq('verified', false)

      return Response.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    // Send security notification to CURRENT email (non-blocking)
    if (currentUser.email) {
      try {
        await sendSecurityNotification(currentUser.email, newEmail)
      } catch (notificationError) {
        console.error('Failed to send security notification:', notificationError)
        // Don't fail the request if security notification fails
      }
    }

    return Response.json({
      success: true,
      message: 'Verification code sent! Please check your new email.',
      currentEmail: currentUser.email,
      newEmail,
      requiresOTP: true
    }, { status: 200 })

  } catch (error) {
    console.error('Send email change request error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
