'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, ShieldCheck, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserModerationActionsProps {
  userId: string
  username: string
  isBlocked: boolean
  blockedReason?: string | null
  onStatusChange?: () => void
}

export function UserModerationActions({
  userId,
  username,
  isBlocked,
  blockedReason,
  onStatusChange,
}: UserModerationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const { toast } = useToast()

  const handleBlock = async () => {
    if (!blockReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for blocking this user',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to block user')
      }

      toast({
        title: 'User blocked',
        description: `@${username} has been blocked successfully`,
      })

      setShowBlockModal(false)
      setBlockReason('')
      router.refresh() // Auto-refresh page to show updated status
      onStatusChange?.()
    } catch (error) {
      console.error('Block user error:', error)
      toast({
        title: 'Block failed',
        description: error instanceof Error ? error.message : 'Failed to block user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async () => {
    if (!confirm(`Are you sure you want to unblock @${username}?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unblock user')
      }

      toast({
        title: 'User unblocked',
        description: `@${username} has been unblocked successfully`,
      })

      router.refresh() // Auto-refresh page to show updated status
      onStatusChange?.()
    } catch (error) {
      console.error('Unblock user error:', error)
      toast({
        title: 'Unblock failed',
        description: error instanceof Error ? error.message : 'Failed to unblock user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isBlocked) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleUnblock}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-sm rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-4 h-4" />
          {loading ? 'Unblocking...' : 'Unblock User'}
        </button>
        {blockedReason && (
          <div className="text-xs font-bold text-red-600 border-2 border-red-200 bg-red-50 rounded-lg p-2">
            <div className="flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="break-words">{blockedReason}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowBlockModal(true)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold text-sm rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
      >
        <Ban className="w-4 h-4" />
        Block User
      </button>

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-black">Block User</h2>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 border-4 border-yellow-400 rounded-xl">
              <p className="font-bold text-sm">
                You are about to block <span className="text-red-600">@{username}</span>
              </p>
              <p className="font-bold text-xs text-gray-600 mt-2">
                This will prevent them from accessing their account and all platform features.
              </p>
            </div>

            <div className="mb-6">
              <label className="block font-black text-sm mb-2">
                Reason for blocking <span className="text-red-600">*</span>
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Violation of community guidelines, spam, harassment..."
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold text-sm focus:ring-4 focus:ring-red-200 resize-none"
              />
              <p className="text-xs font-bold text-gray-500 mt-1">
                {blockReason.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlockModal(false)
                  setBlockReason('')
                }}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-black font-black rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={loading || !blockReason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
              >
                {loading ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
