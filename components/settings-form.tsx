"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, MailIcon, Trash2, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { validateEmail } from "@/lib/utils/validation"
import type { Database } from "@/lib/types/database.types"

type User = Database['public']['Tables']['users']['Row']

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter()
  const hasEmail = !!user.email
  const [emailMode, setEmailMode] = useState<'view' | 'add' | 'change'>(
    hasEmail ? 'view' : 'add'
  )
  const [newEmail, setNewEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState({
    newSupporter: user.email_notifications_new_support ?? true,
    weeklyReport: user.email_notifications_security ?? true,
    productUpdates: false,
    marketing: false,
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [emailChangeRequested, setEmailChangeRequested] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [showEmailUpdatedSuccess, setShowEmailUpdatedSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check URL params for email update success
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const emailUpdated = params.get('email_updated') === 'true'

    if (emailUpdated) {
      // Remove query param first
      window.history.replaceState({}, '', '/settings')

      // Schedule state update asynchronously to avoid cascading renders
      const updateTimer = setTimeout(() => {
        setShowEmailUpdatedSuccess(true)

        // Auto-hide after 5 seconds
        const hideTimer = setTimeout(() => setShowEmailUpdatedSuccess(false), 5000)
        return () => clearTimeout(hideTimer)
      }, 0)

      return () => clearTimeout(updateTimer)
    }
  }, [])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Client-side validation
    const error = validateEmail(newEmail)
    setEmailError(error)

    if (error) {
      setIsSubmitting(false)
      return
    }

    try {
      // Send OTP for add mode
      const response = await fetch('/api/user/email/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      })

      const result = await response.json()

      if (!response.ok) {
        setEmailError(result.error || 'Failed to send verification code')
        setIsSubmitting(false)
        return
      }

      // Success - show OTP input
      setOtpSent(true)
      setEmailError(null)
      setIsSubmitting(false)
    } catch (error) {
      console.error('Send OTP error:', error)
      setEmailError('Failed to send verification code. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate OTP format
    if (!/^\d{6}$/.test(otp)) {
      setEmailError('Please enter a valid 6-digit code')
      setIsSubmitting(false)
      return
    }

    try {
      // Verify OTP
      const response = await fetch('/api/user/email/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, otp })
      })

      const result = await response.json()

      if (!response.ok) {
        setEmailError(result.error || 'Invalid verification code')
        setIsSubmitting(false)
        return
      }

      // Success - refresh page to show new email
      router.refresh()
    } catch (error) {
      console.error('Verify OTP error:', error)
      setEmailError('Verification failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Client-side validation
    const error = validateEmail(newEmail)
    setEmailError(error)

    if (error) {
      setIsSubmitting(false)
      return
    }

    // Check if email is same as current
    if (newEmail === user.email) {
      setEmailError('This is already your current email address')
      setIsSubmitting(false)
      return
    }

    try {
      // Send confirmation link for change mode
      const response = await fetch('/api/user/email/send-change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail })
      })

      const result = await response.json()

      if (!response.ok) {
        setEmailError(result.error || 'Failed to send confirmation')
        setIsSubmitting(false)
        return
      }

      // Success - show confirmation message
      setEmailChangeRequested(true)
      setIsSubmitting(false)

      // Reset after 10 seconds
      setTimeout(() => {
        setEmailChangeRequested(false)
        setEmailError(null)
      }, 10000)
    } catch (error) {
      console.error('Send email request error:', error)
      setEmailError('Failed to send confirmation. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    // First confirmation
    const firstConfirm = confirm(
      "⚠️ Are you sure you want to delete your account?\n\nThis will permanently delete:\n- Your profile and all data\n- All your supporters and support history\n- Your avatar and cover images\n\nThis action cannot be undone!"
    )

    if (!firstConfirm) {
      setShowDeleteConfirm(false)
      return
    }

    // Second confirmation
    const secondConfirm = confirm(
      "🚨 FINAL WARNING!\n\nThis action is IRREVERSIBLE. Your account will be permanently deleted.\n\nAre you absolutely certain?"
    )

    if (!secondConfirm) {
      setShowDeleteConfirm(false)
      return
    }

    setDeleting(true)

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert(`❌ Deletion failed: ${result.error || 'Unknown error'}`)
        setDeleting(false)
        setShowDeleteConfirm(false)
        return
      }

      // Success - redirect to home page
      alert('✅ Your account has been permanently deleted.')
      router.push('/')
    } catch (error) {
      alert(`❌ Deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
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

        {/* Email Section */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#CCFF00] border-b-4 border-black p-4 flex items-center gap-3">
            <MailIcon className="w-6 h-6" />
            <h2 className="text-2xl font-black">Email</h2>
          </div>
          <div className="p-6">
            <p className="text-lg font-bold mb-6">
              {emailMode === 'view'
                ? 'Manage your email address for account login and notifications'
                : emailMode === 'add'
                ? 'Add an email address to enable email login'
                : 'Update your email address'
              }
            </p>

            {/* Success message after email confirmation */}
            {showEmailUpdatedSuccess && (
              <div className="bg-green-500 text-white p-4 rounded-xl border-4 border-black mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  <span className="font-bold">Email updated successfully! Your new email is now active.</span>
                </div>
              </div>
            )}

            {/* Confirmation message after sending email request */}
            {emailChangeRequested && (
              <div className="bg-[#0000FF] text-white p-6 rounded-xl border-4 border-black mb-6">
                <div className="flex items-start gap-3">
                  <MailIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-lg font-black mb-2">
                      {emailMode === 'add' ? 'Verification link sent!' : 'Confirmation link sent!'}
                    </p>
                    <p className="text-sm font-bold mb-3">
                      Please check <span className="bg-[#CCFF00] text-black px-2 py-1 rounded">{newEmail}</span> and click the link to complete.
                    </p>
                    {emailMode === 'change' && user.email && (
                      <p className="text-xs font-bold opacity-90">
                        A security notification was also sent to your current email: <span className="underline">{user.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* State 1: View mode - User has email */}
            {emailMode === 'view' && (
              <div className="space-y-6">
                <div className="bg-gray-50 border-4 border-black rounded-xl p-6">
                  <Label className="text-sm font-bold text-gray-600 mb-2 block">Current Email</Label>
                  <p className="text-2xl font-black">{user.email}</p>
                </div>
                <Button
                  onClick={() => {
                    setEmailMode('change')
                    setNewEmail('')
                    setEmailError(null)
                  }}
                  className="bg-[#0000FF] hover:bg-[#0000CC] text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Change Email
                </Button>
              </div>
            )}

            {/* State 2: Add mode with OTP */}
            {emailMode === 'add' && !otpSent && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" className="text-lg font-bold">
                    Email Address
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value)
                      if (emailError) {
                        const error = validateEmail(e.target.value)
                        setEmailError(error)
                      }
                    }}
                    onBlur={() => {
                      const error = validateEmail(newEmail)
                      setEmailError(error)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="your.email@example.com"
                    required
                    disabled={isSubmitting}
                  />
                  {emailError && (
                    <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                      {emailError}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 font-bold">
                    You will receive a 6-digit verification code
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#CCFF00] hover:bg-[#B8E600] text-black border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Code'}
                </Button>
              </form>
            )}

            {/* OTP Verification Step */}
            {emailMode === 'add' && otpSent && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="bg-[#0000FF] text-white p-6 rounded-xl border-4 border-black">
                  <div className="flex items-start gap-3">
                    <MailIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-lg font-black mb-2">Code sent!</p>
                      <p className="text-sm font-bold">
                        We sent a 6-digit code to <span className="bg-[#CCFF00] text-black px-2 py-1 rounded">{newEmail}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-lg font-bold">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      setOtp(value)
                      setEmailError(null)
                    }}
                    className="border-4 border-black text-3xl font-black text-center p-6 focus:ring-4 focus:ring-[#CCFF00] tracking-widest"
                    placeholder="000000"
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                  {emailError && (
                    <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                      {emailError}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 font-bold">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || otp.length !== 6}
                    className="bg-[#CCFF00] hover:bg-[#B8E600] text-black border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Code'}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setOtpSent(false)
                      setOtp('')
                      setEmailError(null)
                    }}
                    disabled={isSubmitting}
                    variant="outline"
                    className="border-4 border-black text-lg font-bold px-8 py-6 hover:bg-gray-100 hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back
                  </Button>
                </div>
              </form>
            )}

            {/* State 3: Change mode with confirmation link */}
            {emailMode === 'change' && (
              <form onSubmit={handleChangeEmail} className="space-y-6">
                {user.email && (
                  <div className="bg-gray-50 border-4 border-black rounded-xl p-4">
                    <Label className="text-sm font-bold text-gray-600 mb-1 block">Current Email</Label>
                    <p className="text-lg font-black">{user.email}</p>
                  </div>
                )}

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
                      if (emailError) {
                        const error = validateEmail(e.target.value)
                        setEmailError(error)
                      }
                    }}
                    onBlur={() => {
                      const error = validateEmail(newEmail)
                      setEmailError(error)
                    }}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
                    placeholder="your.email@example.com"
                    required
                    disabled={emailChangeRequested || isSubmitting}
                  />
                  {emailError && (
                    <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                      {emailError}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 font-bold">
                    You will receive a confirmation link at your new address
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={emailChangeRequested || isSubmitting}
                    className="bg-[#CCFF00] hover:bg-[#B8E600] text-black border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emailChangeRequested ? 'Confirmation Sent' : isSubmitting ? 'Sending...' : 'Send Confirmation Link'}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      setEmailMode('view')
                      setNewEmail('')
                      setEmailError(null)
                      setEmailChangeRequested(false)
                    }}
                    disabled={emailChangeRequested || isSubmitting}
                    variant="outline"
                    className="border-4 border-black text-lg font-bold px-8 py-6 hover:bg-gray-100 hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
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
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700 text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Yes, Delete My Account'
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      variant="outline"
                      className="border-4 border-black text-lg font-bold px-8 py-6 hover:bg-gray-100 hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
