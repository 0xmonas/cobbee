"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet } from "lucide-react"
import { Logo } from "@/components/logo"
import { validateFullName, validateUsername } from "@/lib/utils/validation"
import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useDisconnect } from '@reown/appkit/react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const supabase = createClient()

  const [signupStep, setSignupStep] = useState<"wallet" | "sign" | "details">("wallet")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [formErrors, setFormErrors] = useState<{
    name?: string
    username?: string
  }>({})

  // Watch for wallet connection
  useEffect(() => {
    if (isConnected && address && signupStep === "wallet") {
      setWalletAddress(address)
      setSignupStep("sign")
    }
  }, [isConnected, address, signupStep])

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      await open()
    } catch (error) {
      console.error('Wallet connection error:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSignMessage = async () => {
    if (!address) {
      console.error('Wallet not connected')
      return
    }

    setIsSigning(true)
    try {
      // ✅ CRITICAL FIX #1: Check blacklist BEFORE Supabase auth
      const { data: isBlacklisted, error: blacklistError } = await supabase.rpc('is_wallet_blacklisted', {
        p_wallet_address: address.toLowerCase()
      })

      if (blacklistError) {
        console.error('Blacklist check error:', blacklistError)
        alert('Unable to verify wallet status. Please try again.')
        return
      }

      if (isBlacklisted) {
        alert('This wallet is banned from the platform.')
        return
      }

      // Supabase SIWE Authentication - EIP-4361 Standard
      // Nonce, timestamp, and signature verification handled by Supabase
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'ethereum',
        statement: 'Welcome to Cobbee! Sign this message to create your account and verify your wallet ownership. This will not trigger any blockchain transaction or cost any gas fees.',
      })

      if (error) {
        console.error('Supabase SIWE error:', error)

        // Handle duplicate signup (user already exists)
        if (error.message.includes('already exists') || error.message.includes('already registered')) {
          // Try to get existing user session
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            // Check if profile is complete
            const { data: profile } = await supabase
              .from('users')
              .select('username, display_name')
              .eq('id', user.id)
              .single()

            if (profile?.username) {
              // Profile complete, redirect to dashboard
              router.push('/dashboard')
              return
            } else {
              // Profile incomplete, continue to details
              setWalletAddress(address)
              setSignupStep("details")
              return
            }
          }
        }

        alert('Sign-in failed. Please try again.')
        return
      }


      // ✅ CRITICAL FIX #2: Check profile completeness
      if (data.session) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check if public.users profile exists and is complete
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('username, display_name')
            .eq('id', user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            // PGRST116 = row not found (which is expected for new users)
            console.error('Profile check error:', profileError)
          }

          if (profile && profile.username) {
            // ✅ Profile complete - redirect to dashboard
            router.push('/dashboard')
          } else {
            // ❌ Profile incomplete or doesn't exist - go to details step
            setWalletAddress(address)
            setSignupStep("details")
          }
        }
      }
    } catch (error) {
      console.error('Sign message error:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setIsSigning(false)
    }
  }

  const handleDisconnectWallet = async () => {
    try {
      // 1. Sign out from Supabase (clear session)
      await supabase.auth.signOut()

      // 2. Disconnect wallet
      await disconnect()

      // 3. Clear all form state
      setWalletAddress("")
      setName("")
      setUsername("")
      setFormErrors({})

      // 4. Reset to wallet step
      setSignupStep("wallet")

    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const handleUseDifferentWallet = async () => {
    // Disconnect and reopen modal for new connection
    await handleDisconnectWallet()
    // Reopen modal after disconnect
    setTimeout(() => {
      open()
    }, 100)
  }

  const validateField = (field: "name" | "username", value: string) => {
    const errors = { ...formErrors }

    if (field === "name") {
      const error = validateFullName(value)
      if (error) {
        errors.name = error
      } else {
        delete errors.name
      }
    } else if (field === "username") {
      const error = validateUsername(value)
      if (error) {
        errors.username = error
      } else {
        delete errors.username
      }
    }

    setFormErrors(errors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors: { name?: string; username?: string } = {}

    const nameError = validateFullName(name)
    if (nameError) errors.name = nameError

    const usernameError = validateUsername(username)
    if (usernameError) errors.username = usernameError

    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      try {
        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('No authenticated user:', userError)
          alert('Authentication error. Please try signing in again.')
          setSignupStep("wallet")
          return
        }

        // Extract wallet address from user metadata
        const walletAddressFromAuth = user.user_metadata?.custom_claims?.address?.toLowerCase()

        if (!walletAddressFromAuth) {
          console.error('Wallet address not found in user metadata')
          alert('Wallet address not found. Please try signing in again.')
          setSignupStep("wallet")
          return
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.toLowerCase())
          .single()

        if (existingUser) {
          setFormErrors({ username: 'Username already taken' })
          return
        }

        // Create profile immediately (no email)
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          wallet_address: walletAddressFromAuth,
          email: null,
          username: username.toLowerCase(),
          display_name: name,
          bio: null,
          coffee_price: 1.00,
          is_active: true,
          email_verified: false
        })

        if (insertError) {
          console.error('Profile creation error:', insertError)

          // Handle unique constraint violations
          if (insertError.code === '23505') {
            if (insertError.message.includes('username')) {
              setFormErrors({ username: 'Username already taken' })
            } else if (insertError.message.includes('wallet_address')) {
              // Profile already exists - redirect to dashboard
              router.push('/dashboard')
            } else {
              alert('This account already exists.')
            }
          } else {
            alert('Failed to create profile. Please try again.')
          }
          return
        }

        router.push('/dashboard')
      } catch (error) {
        console.error('Unexpected error during signup:', error)
        alert('An unexpected error occurred. Please try again.')
      }
    }
  }


  // Connect Wallet Step
  if (signupStep === "wallet") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <Logo size="lg" className="w-16 h-16" />
            <span className="text-4xl font-black">Cobbee</span>
          </Link>

          <div className="bg-[#FF6B35] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-black text-white mb-2">Get started</h1>
            <p className="text-lg font-bold text-white mb-8">Connect your wallet to create your account</p>

            <div className="space-y-6">
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Wallet className="w-6 h-6" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>

              <div className="mt-6 text-center">
                <p className="text-sm font-bold text-white">
                  By continuing, you agree to the{" "}
                  <Link href="/terms" className="underline hover:no-underline">
                    terms of service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:no-underline">
                    privacy policy
                  </Link>
                  .
                </p>
              </div>

              <div className="mt-6 text-center">
                <p className="text-lg font-bold text-white">
                  Already have an account?{" "}
                  <Link href="/login" className="underline hover:no-underline">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sign Message Step
  if (signupStep === "sign") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <Logo size="lg" className="w-16 h-16" />
            <span className="text-4xl font-black">Cobbee</span>
          </Link>

          <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-black text-white mb-2">Sign Message in Wallet</h1>
            <p className="text-lg font-bold text-white mb-8">
              Please sign the message in your wallet to verify ownership
            </p>

            <div className="space-y-6">
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-600 mb-2">Connected Wallet</p>
                <p className="text-base font-black font-mono break-all">{walletAddress}</p>
              </div>

              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-600 mb-3">Message to sign:</p>
                <p className="text-base font-bold leading-relaxed">
                  Welcome to Cobbee!
                  <br />
                  <br />
                  Sign this message to create your account and verify your wallet ownership.
                  <br />
                  <br />
                  This will not trigger any blockchain transaction or cost any gas fees.
                </p>
              </div>

              <Button
                onClick={handleSignMessage}
                disabled={isSigning}
                className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigning ? "Signing..." : "Sign Message"}
              </Button>

              <div className="flex gap-4">
                <button
                  onClick={handleUseDifferentWallet}
                  className="flex-1 text-center text-white font-bold hover:underline"
                >
                  Use different wallet
                </button>
                <button
                  onClick={handleDisconnectWallet}
                  className="flex-1 text-center text-white font-bold hover:underline"
                >
                  Disconnect & Cancel
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm font-bold text-white">
                  By continuing, you agree to the{" "}
                  <Link href="/terms" className="underline hover:no-underline">
                    terms of service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:no-underline">
                    privacy policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  // User Details Step (default)
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <Logo size="lg" className="w-16 h-16" />
          <span className="text-4xl font-black">Cobbee</span>
        </Link>

        <div className="bg-[#FF6B35] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black text-white mb-2">Get started</h1>
          <p className="text-lg font-bold text-white mb-8">Create your creator page</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-lg font-black text-white mb-2 block">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  validateField("name", e.target.value)
                }}
                placeholder="John Doe"
                className="text-lg font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
              />
              {formErrors.name && (
                <p className="mt-2 text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                  {formErrors.name}
                </p>
              )}
            </div>

            <div>
              <label className="text-lg font-black text-white mb-2 block">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  validateField("username", e.target.value)
                }}
                placeholder="johndoe"
                className="text-lg font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
              />
              {formErrors.username && (
                <p className="mt-2 text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                  {formErrors.username}
                </p>
              )}
              {username && !formErrors.username && (
                <div className="mt-3 bg-white border-2 border-black rounded-lg px-4 py-2">
                  <p className="text-sm font-bold text-gray-600">Your page will be:</p>
                  <p className="text-base font-black text-[#0000FF]">cobbee.fun/{username}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm font-bold text-white text-center">
                By continuing, you agree to the{" "}
                <Link href="/terms" className="underline hover:no-underline">
                  terms of service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:no-underline">
                  privacy policy
                </Link>
                .
              </p>

              <Button
                type="submit"
                className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Create account
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-lg font-bold text-white">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:no-underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
