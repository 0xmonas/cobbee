import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateEmail } from '@/lib/utils/validation'
import { generateOTP, getOTPExpiry, hashOTP, sendOtpEmail } from '@/lib/email'
import { authRateLimit, getRateLimitIdentifier } from '@/lib/security/ratelimit'
import { sanitizeEmail } from '@/lib/security/sanitize'

/**
 * Add Email API (Custom OTP-based with Resend)
 *
 * POST /api/user/email/add
 *
 * Generates and sends 6-digit OTP code to new email address for users who don't have an email yet
 * OTP is stored in database with 10-minute expiry
 * Requires authentication
 * User must verify OTP via /api/user/email/verify-otp to complete email addition
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 email add requests per 15 minutes per IP
    const identifier = getRateLimitIdentifier(request)
    const { success: rateLimitOk, reset } = await authRateLimit.limit(identifier)

    if (!rateLimitOk) {
      return Response.json(
        {
          error: 'Too many email add requests. Please try again later.',
          retryAfter: reset
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000))
          }
        }
      )
    }

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
    const { email } = body

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Sanitize email input (XSS protection)
    const sanitizedEmail = sanitizeEmail(email)
    if (!sanitizedEmail) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Server-side email validation
    const emailError = validateEmail(sanitizedEmail)
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

    // Check if user already has an email
    if (currentUser?.email) {
      return Response.json(
        { error: 'You already have an email address. Use the change email feature instead.' },
        { status: 400 }
      )
    }

    // Check if email is already used by another user in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .single()

    if (existingUser) {
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
        email: sanitizedEmail,
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

    // Send OTP via Resend
    try {
      await sendOtpEmail(sanitizedEmail, otpCode)
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError)

      // Clean up database entry if email fails
      await supabase
        .from('email_verifications')
        .delete()
        .eq('user_id', user.id)
        .eq('email', sanitizedEmail)
        .eq('verified', false)

      return Response.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Verification code sent! Please check your email.',
      email: sanitizedEmail,
      requiresOTP: true
    }, { status: 200 })

  } catch (error) {
    console.error('Add email error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
