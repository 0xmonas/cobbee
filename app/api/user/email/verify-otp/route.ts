import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyOTPHash } from '@/lib/email'

/**
 * Verify OTP for Email Addition (Production-Grade Security)
 *
 * POST /api/user/email/verify-otp
 *
 * Security Features (2025 Standards):
 * - Argon2id hash verification (OWASP, RFC 9106)
 * - Brute force protection (max 5 attempts, OWASP ASVS)
 * - Account lockout (15 min after max attempts, NIST SP 800-63B)
 * - Timing attack resistance (constant-time comparison)
 * - Audit logging (compliance requirement)
 * - IP tracking for fraud detection
 *
 * Compliance:
 * - OWASP ASVS v4.0: Authentication Verification
 * - NIST SP 800-63B: Digital Identity Guidelines
 * - GDPR: Audit trail and data minimization
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
    const { email, otp } = body

    if (!email || !otp) {
      return Response.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      )
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return Response.json(
        { error: 'Invalid OTP format. Must be 6 digits.' },
        { status: 400 }
      )
    }

    // Get IP and User-Agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Get current user data
    const { data: currentUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    // Check if user already has an email
    if (currentUser?.email) {
      return Response.json(
        { error: 'You already have an email address.' },
        { status: 400 }
      )
    }

    // SECURITY CHECK: Is OTP locked due to too many failed attempts?
    const { data: isLocked, error: lockCheckError } = await supabase.rpc('is_otp_locked', {
      p_user_id: user.id,
      p_email: email
    })

    if (lockCheckError) {
      console.error('Lock check error:', lockCheckError)
    }

    if (isLocked) {
      // Log lockout attempt
      await supabase.rpc('log_otp_event', {
        p_user_id: user.id,
        p_email: email,
        p_action: 'locked',
        p_success: false,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_error_message: 'Account temporarily locked due to too many failed attempts'
      })

      return Response.json(
        {
          error: 'Too many failed attempts. Please wait 15 minutes and request a new code.',
          locked: true
        },
        { status: 429 }
      )
    }

    // Get OTP record from database
    const { data: otpRecord, error: fetchError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', email)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      console.error('OTP record not found:', fetchError)

      // Log failed attempt
      await supabase.rpc('log_otp_event', {
        p_user_id: user.id,
        p_email: email,
        p_action: 'failed',
        p_success: false,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_error_message: 'No verification request found'
      })

      return Response.json(
        { error: 'No verification request found. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if OTP is expired (NIST: 5-10 minutes)
    const now = new Date()
    const expiryDate = new Date(otpRecord.expires_at)

    if (now > expiryDate) {
      // Clean up expired OTP
      await supabase
        .from('email_verifications')
        .delete()
        .eq('id', otpRecord.id)

      // Log expiry
      await supabase.rpc('log_otp_event', {
        p_user_id: user.id,
        p_email: email,
        p_action: 'failed',
        p_success: false,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_error_message: 'Verification code expired'
      })

      return Response.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify OTP code using Argon2id (timing-attack resistant)
    const isValid = await verifyOTPHash(otp, otpRecord.otp_code)

    if (!isValid) {
      // BRUTE FORCE PROTECTION: Increment attempt counter
      const { data: attemptResult } = await supabase.rpc('increment_otp_attempt', {
        p_user_id: user.id,
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      })

      // Log failed attempt
      await supabase.rpc('log_otp_event', {
        p_user_id: user.id,
        p_email: email,
        p_action: 'failed',
        p_success: false,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_error_message: `Invalid code (attempt ${attemptResult?.[0]?.attempts || 'unknown'})`
      })

      const attemptsLeft = 5 - (attemptResult?.[0]?.attempts || 0)

      if (attemptResult?.[0]?.locked) {
        return Response.json(
          {
            error: 'Too many failed attempts. Account locked for 15 minutes.',
            locked: true,
            lockedUntil: attemptResult[0].locked_until_ts
          },
          { status: 429 }
        )
      }

      return Response.json(
        {
          error: 'Invalid verification code. Please check and try again.',
          attemptsLeft: Math.max(0, attemptsLeft)
        },
        { status: 400 }
      )
    }

    // ✅ OTP VERIFIED SUCCESSFULLY!

    // Reset attempt counter and mark as verified
    await supabase.rpc('reset_otp_attempts', {
      p_user_id: user.id,
      p_email: email
    })

    // Update public.users table with verified email
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: email,
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update email in public.users:', updateError)

      // Log failure
      await supabase.rpc('log_otp_event', {
        p_user_id: user.id,
        p_email: email,
        p_action: 'failed',
        p_success: false,
        p_ip_address: ipAddress,
        p_user_agent: userAgent,
        p_error_message: 'Database update failed'
      })

      return Response.json(
        { error: 'Failed to save email. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful verification
    await supabase.rpc('log_otp_event', {
      p_user_id: user.id,
      p_email: email,
      p_action: 'verified',
      p_success: true,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_error_message: null
    })

    return Response.json({
      success: true,
      message: 'Email added successfully!',
      email: email,
      verified: true
    }, { status: 200 })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
