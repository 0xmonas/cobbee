"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Coffee, CheckCircle2, XCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showOTP, setShowOTP] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [otpStatus, setOtpStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowOTP(true)
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index}`)
      nextInput?.focus()
    }
  }

  const handleVerifyOTP = () => {
    const otpValue = otp.join("")
    if (otpValue === "123456") {
      setOtpStatus("success")
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } else {
      setOtpStatus("error")
      setTimeout(() => setOtpStatus("idle"), 3000)
    }
  }

  if (showOTP) {
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
                  <span className="font-bold">Email verified! Creating your account...</span>
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
                Verify & Create Account
              </Button>

              <button
                onClick={() => setShowOTP(false)}
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
          <h1 className="text-4xl font-black text-white mb-2">Get started</h1>
          <p className="text-lg font-bold text-white mb-8">Create your creator page</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-lg font-black text-white mb-2 block">Full Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="text-lg font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
              />
            </div>

            <div>
              <label className="text-lg font-black text-white mb-2 block">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                required
                className="text-lg font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
              />
            </div>

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
