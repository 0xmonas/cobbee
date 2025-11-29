'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, ShieldCheck, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface WalletModerationActionsProps {
  walletAddress: string
  isBlacklisted: boolean
  blacklistReason?: string | null
  onStatusChange?: () => void
}

export function WalletModerationActions({
  walletAddress,
  isBlacklisted,
  blacklistReason,
  onStatusChange,
}: WalletModerationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showBlacklistModal, setShowBlacklistModal] = useState(false)
  const [reason, setReason] = useState('')
  const { toast } = useToast()

  const handleBlacklist = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for blacklisting this wallet',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/wallets/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          reason: reason.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to blacklist wallet')
      }

      toast({
        title: 'Wallet blacklisted',
        description: `Wallet has been blacklisted successfully`,
      })

      setShowBlacklistModal(false)
      setReason('')
      router.refresh() // Auto-refresh page to show updated status
      onStatusChange?.()
    } catch (error) {
      console.error('Blacklist wallet error:', error)
      toast({
        title: 'Blacklist failed',
        description: error instanceof Error ? error.message : 'Failed to blacklist wallet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnblacklist = async () => {
    const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    if (!confirm(`Are you sure you want to unblacklist ${shortAddress}?`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/wallets/unblacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unblacklist wallet')
      }

      toast({
        title: 'Wallet unblacklisted',
        description: `Wallet has been unblacklisted successfully`,
      })

      router.refresh() // Auto-refresh page to show updated status
      onStatusChange?.()
    } catch (error) {
      console.error('Unblacklist wallet error:', error)
      toast({
        title: 'Unblacklist failed',
        description: error instanceof Error ? error.message : 'Failed to unblacklist wallet',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (isBlacklisted) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={handleUnblacklist}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-sm rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
        >
          <ShieldCheck className="w-4 h-4" />
          {loading ? 'Unblacklisting...' : 'Unblacklist'}
        </button>
        {blacklistReason && (
          <div className="text-xs font-bold text-red-600 border-2 border-red-200 bg-red-50 rounded-lg p-2">
            <div className="flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              <span className="break-words">{blacklistReason}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowBlacklistModal(true)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold text-sm rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
      >
        <Ban className="w-4 h-4" />
        Blacklist
      </button>

      {/* Blacklist Modal */}
      {showBlacklistModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-black">Blacklist Wallet</h2>
            </div>

            <div className="mb-4 p-4 bg-yellow-50 border-4 border-yellow-400 rounded-xl">
              <p className="font-bold text-sm">
                You are about to blacklist wallet:{' '}
                <span className="text-red-600 font-mono text-xs block mt-1">
                  {walletAddress.slice(0, 12)}...{walletAddress.slice(-10)}
                </span>
              </p>
              <p className="font-bold text-xs text-gray-600 mt-2">
                This will prevent this wallet from sending new supports to any creator.
              </p>
            </div>

            <div className="mb-6">
              <label className="block font-black text-sm mb-2">
                Reason for blacklisting <span className="text-red-600">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Fraudulent activity, multiple name variations, spam..."
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 border-4 border-black rounded-xl font-bold text-sm focus:ring-4 focus:ring-red-200 resize-none"
              />
              <p className="text-xs font-bold text-gray-500 mt-1">
                {reason.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBlacklistModal(false)
                  setReason('')
                }}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-black font-black rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleBlacklist}
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:cursor-not-allowed"
              >
                {loading ? 'Blacklisting...' : 'Blacklist Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
