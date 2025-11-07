"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Coffee, Wallet, CheckCircle2, XCircle } from "lucide-react"
import { setCurrentUser } from "@/lib/auth-utils"
import { mockCreators } from "@/lib/mock-data"

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"wallet" | "email">("wallet")
  const [walletStep, setWalletStep] = useState<"connect" | "sign">("connect")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [email, setEmail] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [otpStatus, setOtpStatus] = useState<"idle" | "success" | "error">("idle")

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowOTP(true)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerifyOTP = () => {
    const otpValue = otp.join("")
    if (otpValue === "123456") {
      setOtpStatus("success")
      setTimeout(() => {
        setCurrentUser({ id: mockCreators[0].id, username: mockCreators[0].username })
        router.push("/dashboard")
      }, 2000)
    } else {
      setOtpStatus("error")
      setTimeout(() => setOtpStatus("idle"), 3000)
    }
  }

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    // TODO: Implement actual wallet connection
    setTimeout(() => {
      setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
      setIsConnecting(false)
      setWalletStep("sign")
    }, 1500)
  }

  const handleSignMessage = async () => {
    setIsSigning(true)
    // TODO: Implement actual message signing
    setTimeout(() => {
      setIsSigning(false)
      setCurrentUser({ id: mockCreators[0].id, username: mockCreators[0].username })
      router.push("/dashboard")
    }, 1500)
  }

  // Wallet Sign Message Screen
  if (loginMethod === "wallet" && walletStep === "sign") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <div className="bg-[#CCFF00] w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
              <Coffee className="w-8 h-8" />
            </div>
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

              <button
                onClick={() => {
                  setWalletStep("connect")
                  setWalletAddress("")
                }}
                className="w-full text-center text-white font-bold hover:underline"
              >
                Use different wallet
              </button>
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
            <div className="bg-[#CCFF00] w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
              <Coffee className="w-8 h-8" />
            </div>
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
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
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
          <div className="bg-[#CCFF00] w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
            <Coffee className="w-8 h-8" />
          </div>
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
