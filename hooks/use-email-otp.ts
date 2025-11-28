import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useEmailOTP() {
  const supabase = createClient()
  const [isSending, setIsSending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  /**
   * Send OTP for SIGNUP (adds email to authenticated Web3 user)
   * Uses updateUser() - requires existing auth session
   * @param email - Email address to send OTP to
   * @returns { success, error }
   */
  const sendOTPForSignup = async (email: string) => {
    setIsSending(true)
    try {
      // Update authenticated user's email - this sends confirmation OTP
      const { error } = await supabase.auth.updateUser({
        email: email
      })

      if (error) {
        console.error('Send OTP error (signup):', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected OTP send error:', error)
      return { success: false, error: 'Failed to send verification code' }
    } finally {
      setIsSending(false)
    }
  }

  /**
   * Send OTP for LOGIN (passwordless email login)
   * Uses signInWithOtp() - no session required
   * @param email - Email address to send OTP to
   * @returns { success, error }
   */
  const sendOTPForLogin = async (email: string) => {
    setIsSending(true)
    try {
      // IMPORTANT: Check if email exists in public.users BEFORE sending OTP
      // This prevents new signups via email login
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .single()

      if (userError || !existingUser) {
        // Email not found in users table
        console.error('Email not registered:', email)
        return {
          success: false,
          error: 'This email is not registered. Please add your email in Settings after logging in with your wallet.'
        }
      }

      // Send magic link OTP for login (email is confirmed to exist)
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      })

      if (error) {
        console.error('Send OTP error (login):', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Unexpected OTP send error:', error)
      return { success: false, error: 'Failed to send login code' }
    } finally {
      setIsSending(false)
    }
  }

  /**
   * Verify OTP code (works for both signup and login)
   * @param email - Email address
   * @param token - 6-digit OTP code
   * @param type - 'signup' or 'login'
   * @returns { success, error, session }
   */
  const verifyOTP = async (email: string, token: string, type: 'signup' | 'login' = 'signup') => {
    setIsVerifying(true)
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: type === 'signup' ? 'email_change' : 'email' // email_change for signup, email for login
      })

      if (error) {
        console.error('Verify OTP error:', error)
        return { success: false, error: error.message, session: null }
      }

      return { success: true, error: null, session: data.session }
    } catch (error) {
      console.error('Unexpected OTP verify error:', error)
      return { success: false, error: 'Failed to verify code', session: null }
    } finally {
      setIsVerifying(false)
    }
  }

  return {
    sendOTPForSignup,
    sendOTPForLogin,
    verifyOTP,
    isSending,
    isVerifying
  }
}
