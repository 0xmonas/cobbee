"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Coffee, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [otpStatus, setOtpStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push("/dashboard")
  }

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setShowOTP(true)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerifyOTP = () => {
    const otpValue = otp.join("")
    // Mock verification
    if (otpValue === "123456") {
      setOtpStatus("success")
      setTimeout(() => {
        setShowForgotPassword(false)
        setShowOTP(false)
        setOtp(["", "", "", "", "", ""])
        setOtpStatus("idle")
      }, 2000)
    } else {
      setOtpStatus("error")
      setTimeout(() => setOtpStatus("idle"), 3000)
    }
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-3 mb-12">
            <div className="bg-[#CCFF00] w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
              <Coffee className="w-8 h-8" />
            </div>
            <span className="text-4xl font-black">BuyCoffee</span>
          </Link>

          <div className="bg-[#FF6B35] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={() => {
                setShowForgotPassword(false)
                setShowOTP(false)
                setOtpStatus("idle")
              }}
              className="flex items-center gap-2 text-white hover:text-black transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold">Back to login</span>
            </button>

            <h1 className="text-4xl font-black text-white mb-2">Reset Password</h1>
            <p className="text-lg font-bold text-white mb-8">
              {showOTP ? "Enter the code sent to your email" : "We'll send you a reset code"}
            </p>

            {!showOTP ? (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label className="text-lg font-black text-white mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="text-lg font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Send Reset Code
                </Button>
              </form>
            ) : (
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
                    <span className="font-bold">Code verified! Redirecting...</span>
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
                  Verify Code
                </Button>

                <button
                  onClick={() => setShowOTP(false)}
                  className="w-full text-center text-white font-bold hover:underline"
                >
                  Resend code
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-12">
          <div className="bg-[#CCFF00] w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
            <Coffee className="w-8 h-8" />
          </div>
          <span className="text-4xl font-black">BuyCoffee</span>
        </Link>

        <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-4xl font-black text-white mb-2">Welcome back</h1>
          <p className="text-lg font-bold text-white mb-8">Log in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label className="text-lg font-black text-white mb-2 block">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-lg font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-white font-bold hover:underline mt-2 text-sm"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Log in
            </Button>
          </form>

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
