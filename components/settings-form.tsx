"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, MailIcon, Trash2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { validateEmail } from "@/lib/utils/validation"
import type { Database } from "@/lib/types/database.types"

type User = Database['public']['Tables']['users']['Row']

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [newEmail, setNewEmail] = useState(user.email || "")
  const [emailNotifications, setEmailNotifications] = useState({
    newSupporter: user.email_notifications_new_supporter ?? true,
    weeklyReport: user.email_notifications_weekly_report ?? true,
    productUpdates: user.email_notifications_product_updates ?? false,
    marketing: user.email_notifications_marketing ?? false,
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [showEmailOTP, setShowEmailOTP] = useState(false)
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""])
  const [emailOtpStatus, setEmailOtpStatus] = useState<"idle" | "success" | "error">("idle")
  const [emailError, setEmailError] = useState<string | null>(null)

  const handleEmailChange = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email
    const error = validateEmail(newEmail)
    setEmailError(error)

    // Only proceed if no error
    if (!error) {
      setShowEmailOTP(true)
    }
  }

  const handleEmailOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...emailOtp]
    newOtp[index] = value
    setEmailOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`email-otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerifyEmailOTP = () => {
    const otpValue = emailOtp.join("")
    if (otpValue === "123456") {
      setEmailOtpStatus("success")
      setTimeout(() => {
        setShowEmailOTP(false)
        setEmailOtp(["", "", "", "", "", ""])
        setEmailOtpStatus("idle")
      }, 2000)
    } else {
      setEmailOtpStatus("error")
      setTimeout(() => setEmailOtpStatus("idle"), 3000)
    }
  }

  const handleDeleteAccount = () => {
    alert("Account deletion requested. In a real app, this would delete your account.")
    setShowDeleteConfirm(false)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-[#0000FF]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-white hover:text-[#CCFF00] transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="text-lg font-bold">Back to Dashboard</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-white">Settings</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">

        {/* Email Change Section */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#CCFF00] border-b-4 border-black p-4 flex items-center gap-3">
            <MailIcon className="w-6 h-6" />
            <h2 className="text-2xl font-black">Change Email</h2>
          </div>
          <div className="p-6">
            <p className="text-lg font-bold mb-6">Update your email address for account notifications</p>
            <form onSubmit={handleEmailChange} className="space-y-6">
              {!showEmailOTP ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail" className="text-lg font-bold">
                      New Email Address
                    </Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value)
                        // Clear error on change
                        if (emailError) {
                          const error = validateEmail(e.target.value)
                          setEmailError(error)
                        }
                      }}
                      onBlur={() => {
                        // Validate on blur
                        const error = validateEmail(newEmail)
                        setEmailError(error)
                      }}
                      className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                      placeholder="your.email@example.com"
                      required
                    />
                    {emailError && (
                      <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                        {emailError}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 font-bold">
                      You will receive a verification code at your new address
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="bg-[#CCFF00] hover:bg-[#B8E600] text-black border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Update Email
                  </Button>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#CCFF00] border-4 border-black rounded-xl p-6">
                    <p className="text-lg font-black mb-4">Enter verification code sent to {newEmail}</p>
                    <div className="flex gap-2 justify-center mb-4">
                      {emailOtp.map((digit, index) => (
                        <Input
                          key={index}
                          id={`email-otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleEmailOtpChange(index, e.target.value)}
                          className="w-12 h-12 text-center text-2xl font-black border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                        />
                      ))}
                    </div>

                    {emailOtpStatus === "success" && (
                      <div className="flex items-center gap-2 bg-green-500 text-white p-4 rounded-xl border-4 border-black mb-4">
                        <CheckCircle2 className="w-6 h-6" />
                        <span className="font-bold">Email updated successfully!</span>
                      </div>
                    )}

                    {emailOtpStatus === "error" && (
                      <div className="flex items-center gap-2 bg-red-500 text-white p-4 rounded-xl border-4 border-black mb-4">
                        <XCircle className="w-6 h-6" />
                        <span className="font-bold">Invalid code. Please try again.</span>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        onClick={handleVerifyEmailOTP}
                        disabled={emailOtp.some((d) => !d)}
                        className="flex-1 bg-[#0000FF] hover:bg-[#0000CC] text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Verify Code
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowEmailOTP(false)
                          setEmailOtp(["", "", "", "", "", ""])
                          setEmailOtpStatus("idle")
                        }}
                        variant="outline"
                        className="border-4 border-black text-lg font-bold px-8 py-6 hover:bg-gray-100 hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Email Notifications Section */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#FF6B35] border-b-4 border-black p-4 flex items-center gap-3">
            <MailIcon className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-black text-white">Email Notifications</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between py-4 border-b-2 border-gray-200">
              <div>
                <p className="text-lg font-bold">New Supporter</p>
                <p className="text-sm text-gray-600 font-bold">Get notified when someone supports you</p>
              </div>
              <Switch
                checked={emailNotifications.newSupporter}
                onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, newSupporter: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-4 border-b-2 border-gray-200">
              <div>
                <p className="text-lg font-bold">Weekly Report</p>
                <p className="text-sm text-gray-600 font-bold">Receive weekly summary of your earnings</p>
              </div>
              <Switch
                checked={emailNotifications.weeklyReport}
                onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, weeklyReport: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-4 border-b-2 border-gray-200">
              <div>
                <p className="text-lg font-bold">Product Updates</p>
                <p className="text-sm text-gray-600 font-bold">Learn about new features and improvements</p>
              </div>
              <Switch
                checked={emailNotifications.productUpdates}
                onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, productUpdates: checked })}
              />
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-lg font-bold">Marketing Emails</p>
                <p className="text-sm text-gray-600 font-bold">Tips and inspiration for creators</p>
              </div>
              <Switch
                checked={emailNotifications.marketing}
                onCheckedChange={(checked) => setEmailNotifications({ ...emailNotifications, marketing: checked })}
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#FF0000] border-b-4 border-black p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-black text-white">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border-4 border-red-500 p-6 rounded-lg">
              <h3 className="text-xl font-black mb-2 text-red-900">Delete Account</h3>
              <p className="text-lg font-bold mb-4 text-red-800">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 hover:bg-red-700 text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-black text-red-900">Are you absolutely sure?</p>
                  <div className="flex gap-4">
                    <Button
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700 text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Yes, Delete My Account
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      className="border-4 border-black text-lg font-bold px-8 py-6 hover:bg-gray-100 hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
