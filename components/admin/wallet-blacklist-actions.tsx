'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Shield, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WalletBlacklistActionsProps {
  walletAddress: string
  isBlacklisted: boolean
  currentReason?: string | null
}

export function WalletBlacklistActions({
  walletAddress,
  isBlacklisted,
  currentReason,
}: WalletBlacklistActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false)
  const [isUnblacklistModalOpen, setIsUnblacklistModalOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [banScope, setBanScope] = useState<'full' | 'support_only'>('full')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBlacklist = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Reason is required',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/wallets/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          reason: reason.trim(),
          notes: notes.trim() || null,
          ban_scope: banScope,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to blacklist wallet')
      }

      toast({
        title: 'Wallet Blacklisted',
        description: `${walletAddress.slice(0, 10)}... has been blacklisted. ${data.affectedSupports || 0} pending supports failed.`,
      })

      setIsBlacklistModalOpen(false)
      setReason('')
      setNotes('')
      router.refresh()
    } catch (error) {
      console.error('Blacklist error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to blacklist wallet',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnblacklist = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/wallets/unblacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to unblacklist wallet')
      }

      toast({
        title: 'Wallet Unblacklisted',
        description: `${walletAddress.slice(0, 10)}... has been removed from blacklist.`,
      })

      setIsUnblacklistModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Unblacklist error:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to unblacklist wallet',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isBlacklisted) {
    // Unblacklist Button
    return (
      <>
        <button
          onClick={() => setIsUnblacklistModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <Shield className="w-5 h-5 mx-auto" />
        </button>

        <Dialog open={isUnblacklistModalOpen} onOpenChange={setIsUnblacklistModalOpen}>
          <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Unblacklist Wallet?</DialogTitle>
              <DialogDescription className="font-bold">
                Remove this wallet from the blacklist. They will be able to send supports again.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-gray-100 border-2 border-black rounded-lg p-4">
                <div className="text-sm font-bold text-gray-600 mb-1">Wallet Address</div>
                <div className="font-mono font-black">{walletAddress}</div>
              </div>

              {currentReason && (
                <div className="bg-red-50 border-2 border-black rounded-lg p-4">
                  <div className="text-sm font-bold text-gray-600 mb-1">Current Reason</div>
                  <div className="font-bold">{currentReason}</div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsUnblacklistModalOpen(false)}
                disabled={isSubmitting}
                className="border-4 border-black font-black"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnblacklist}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove from Blacklist'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Blacklist Button
  return (
    <>
      <button
        onClick={() => setIsBlacklistModalOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white font-black px-6 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
      >
        <Ban className="w-5 h-5 mx-auto" />
      </button>

      <Dialog open={isBlacklistModalOpen} onOpenChange={setIsBlacklistModalOpen}>
        <DialogContent className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Blacklist Wallet?</DialogTitle>
            <DialogDescription className="font-bold">
              This will prevent the wallet from sending supports and fail any pending transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-100 border-2 border-black rounded-lg p-4">
              <div className="text-sm font-bold text-gray-600 mb-1">Wallet Address</div>
              <div className="font-mono font-black">{walletAddress}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="font-black">
                Reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Spam, fraud, fake transactions, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border-4 border-black font-bold resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="font-black">
                Internal Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional details for admin reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border-4 border-black font-bold resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ban-scope" className="font-black">
                Ban Scope
              </Label>
              <select
                id="ban-scope"
                value={banScope}
                onChange={(e) => setBanScope(e.target.value as 'full' | 'support_only')}
                className="w-full border-4 border-black rounded-xl p-3 font-bold"
              >
                <option value="full">Full Ban (all platform features)</option>
                <option value="support_only">Support Only (can't send supports)</option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsBlacklistModalOpen(false)}
              disabled={isSubmitting}
              className="border-4 border-black font-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBlacklist}
              disabled={isSubmitting || !reason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Blacklisting...
                </>
              ) : (
                'Blacklist Wallet'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
