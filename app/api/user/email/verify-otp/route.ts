import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyOTPHash } from '@/lib/email'

/**
 * Verify OTP for Email Addition (Custom Database Verification)
 *
 * POST /api/user/email/verify-otp
 *
 * Verifies the 6-digit OTP code against database
 * Checks expiry and marks as used after successful verification
 * On success, adds email to public.users table
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

    // Get OTP record from database
    const { data: otpRecord, error: fetchError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('email', email)
      .eq('verified', false)
      .single()

    if (fetchError || !otpRecord) {
      console.error('OTP record not found:', fetchError)
      return Response.json(
        { error: 'No verification request found. Please request a new code.' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    const now = new Date()
    const expiryDate = new Date(otpRecord.expires_at)

    if (now > expiryDate) {
      // Clean up expired OTP
      await supabase
        .from('email_verifications')
        .delete()
        .eq('id', otpRecord.id)

      return Response.json(
        { error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify OTP code
    const isValid = await verifyOTPHash(otp, otpRecord.otp_code)

    if (!isValid) {
      return Response.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      )
    }

    // OTP verified successfully! Mark as used
    const { error: markError } = await supabase
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', otpRecord.id)

    if (markError) {
      console.error('Failed to mark OTP as verified:', markError)
      // Continue anyway - not critical
    }

    // Now update public.users table
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
      return Response.json(
        { error: 'Failed to save email. Please try again.' },
        { status: 500 }
      )
    }

    console.log('Email added successfully:', email)

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
