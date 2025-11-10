"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Wallet, CheckCircle2, XCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import { useAppKit } from '@reown/appkit/react'
import { useAppKitAccount } from '@reown/appkit/react'
import { useDisconnect } from '@reown/appkit/react'
import { createClient } from '@/lib/supabase/client'
import { useEmailOTP } from '@/hooks/use-email-otp'

export default function LoginPage() {
  const router = useRouter()
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const supabase = createClient()
  const { sendOTPForLogin, verifyOTP, isSending, isVerifying } = useEmailOTP()

  const [loginMethod, setLoginMethod] = useState<"wallet" | "email">("wallet")
  const [walletStep, setWalletStep] = useState<"connect" | "sign" | "not-registered">("connect")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [email, setEmail] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [otpStatus, setOtpStatus] = useState<"idle" | "success" | "error">("idle")

  // Watch for wallet connection and check if user is registered
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (isConnected && address && walletStep === "connect") {
        setWalletAddress(address)

        // Check if user exists in public.users BEFORE allowing sign
        const { data: existingUser, error } = await supabase
          .from('users')
          .select('id, username')
          .eq('wallet_address', address.toLowerCase())
          .single()

        if (error || !existingUser) {
          // ❌ User NOT registered - show not-registered screen
          console.log('User not registered:', error)
          setWalletStep("not-registered")
        } else {
          // ✅ User registered - go to sign step
          console.log('User registered:', existingUser)
          setWalletStep("sign")
        }
      }
    }

    checkUserRegistration()
  }, [isConnected, address, walletStep, supabase])

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
      // Check blacklist BEFORE Supabase auth
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

      // Supabase SIWE Authentication
      const { data, error } = await supabase.auth.signInWithWeb3({
        chain: 'ethereum',
        statement: 'Welcome back to Cobbee! Sign this message to verify your wallet ownership and log in to your account. This will not trigger any blockchain transaction or cost any gas fees.',
      })

      if (error) {
        console.error('Supabase SIWE error:', error)
        alert('Sign-in failed. Please try again.')
        return
      }

      console.log('Sign-in successful:', data)

      // ✅ User already verified as registered (checked on wallet connect)
      // Redirect to dashboard
      if (data.session) {
        router.push('/dashboard')
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
      await supabase.auth.signOut()
      await disconnect()
      setWalletAddress("")
      setWalletStep("connect")
      console.log('Disconnected')
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  const handleUseDifferentWallet = async () => {
    await handleDisconnectWallet()
    setTimeout(() => {
      open()
    }, 100)
  }

  // Email Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Send OTP to email
    const { success, error: otpError } = await sendOTPForLogin(email)

    if (!success) {
      console.error('Failed to send OTP:', otpError)
      alert(`Failed to send login code: ${otpError}`)
      return
    }

    setShowOTP(true)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpValue = otp.join("")

    if (otpValue.length !== 6) {
      setOtpStatus("error")
      setTimeout(() => setOtpStatus("idle"), 3000)
      return
    }

    const { success, error: verifyError } = await verifyOTP(email, otpValue, 'login')

    if (!success) {
      console.error('OTP verification failed:', verifyError)
      setOtpStatus("error")
      setTimeout(() => setOtpStatus("idle"), 3000)
      return
    }

    setOtpStatus("success")

    setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
  }

  // Not Registered Screen (wallet exists but no profile in public.users)
  if (loginMethod === "wallet" && walletStep === "not-registered") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <Logo size="lg" className="w-16 h-16" />
            <span className="text-4xl font-black">Cobbee</span>
          </Link>

          <div className="bg-[#FF6B35] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-black text-white mb-2">Account Not Found</h1>
            <p className="text-lg font-bold text-white mb-8">
              This wallet is not registered. Please create an account first.
            </p>

            <div className="space-y-6">
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-600 mb-2">Connected Wallet</p>
                <p className="text-base font-black font-mono break-all">{walletAddress}</p>
              </div>

              <Link href="/signup">
                <Button className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                  Create Account
                </Button>
              </Link>

              <div className="flex gap-4 mt-6">
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Wallet Sign Message Screen
  if (loginMethod === "wallet" && walletStep === "sign") {
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
                  Welcome back to Cobbee!
                  <br />
                  <br />
                  Sign this message to verify your wallet ownership and log in to your account.
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
            </div>
          </div>
        </div>
      </div>
    )
  }

  // OTP Verification Screen
  if (showOTP) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <Logo size="lg" className="w-16 h-16" />
            <span className="text-4xl font-black">Cobbee</span>
          </Link>

          <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-black text-white mb-2">Verify your email</h1>
            <p className="text-lg font-bold text-white mb-8">We sent a code to {email}</p>

            <div className="space-y-6">
              <div>
                <label className="text-lg font-black text-white mb-4 block">Enter 6-digit code</label>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                    />
                  ))}
                </div>
              </div>

              {otpStatus === "success" && (
                <div className="flex items-center gap-2 bg-green-500 text-white p-4 rounded-xl border-4 border-black">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold">Email verified! Logging you in...</span>
                </div>
              )}

              {otpStatus === "error" && (
                <div className="flex items-center gap-2 bg-red-500 text-white p-4 rounded-xl border-4 border-black">
                  <XCircle className="w-6 h-6" />
                  <span className="font-bold">Invalid code. Please try again.</span>
                </div>
              )}

              <Button
                onClick={handleVerifyOTP}
                disabled={otp.some((d) => !d)}
                className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify & Log in
              </Button>

              <button
                onClick={() => {
                  setShowOTP(false)
                  setOtp(["", "", "", "", "", ""])
                }}
                className="w-full text-center text-white font-bold hover:underline"
              >
                Change email or resend code
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Login Screen
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <Logo size="lg" className="w-16 h-16" />
          <span className="text-4xl font-black">Cobbee</span>
        </Link>

        <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-lg font-bold text-white mb-8">Log in to your account</p>

          {loginMethod === "wallet" ? (
            <div className="space-y-6">
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-6 h-6" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-white" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0000FF] text-white font-bold">OR</span>
                </div>
              </div>

              <button
                onClick={() => setLoginMethod("email")}
                className="w-full text-center text-white font-bold hover:underline text-lg"
              >
                Or, continue with email
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div>
                  <label className="text-lg font-black text-white mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="text-lg font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Continue with Email
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-white" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0000FF] text-white font-bold">OR</span>
                </div>
              </div>

              <button
                onClick={() => setLoginMethod("wallet")}
                className="w-full text-center text-white font-bold hover:underline text-lg"
              >
                Or, continue with wallet
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-lg font-bold text-white">
              Don't have an account?{" "}
              <Link href="/signup" className="underline hover:no-underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
