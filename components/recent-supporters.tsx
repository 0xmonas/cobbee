"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Coffee, MessageCircle, Pencil, Trash2, Eye, EyeOff, Lock } from "lucide-react"
import type { Database } from "@/lib/types/database.types"

type Support = Database['public']['Tables']['supports']['Row']

interface RecentSupportersProps {
  supports: Support[]
  isOwnProfile?: boolean
  creatorUsername?: string
  creatorAvatar?: string
  creatorDisplayName?: string
}

export function RecentSupporters({
  supports,
  isOwnProfile = false,
  creatorUsername = "",
  creatorAvatar = "",
  creatorDisplayName = "",
}: RecentSupportersProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [hiddenMessages, setHiddenMessages] = useState<Record<string, boolean>>(
    supports.reduce((acc, support) => ({ ...acc, [support.id]: support.is_hidden_by_creator || false }), {})
  )

  // Update hidden messages when supports prop changes (e.g., after page refresh)
  useEffect(() => {
    setHiddenMessages(
      supports.reduce((acc, support) => ({ ...acc, [support.id]: support.is_hidden_by_creator || false }), {})
    )
  }, [supports])

  const handleReplySubmit = (supportId: string) => {
    if (replyText.trim()) {
      setReplies({ ...replies, [supportId]: replyText })
      setReplyText("")
      setReplyingTo(null)
    }
  }

  const handleEditReply = (supportId: string) => {
    setEditingReply(supportId)
    setReplyText(replies[supportId] || "")
  }

  const handleUpdateReply = (supportId: string) => {
    if (replyText.trim()) {
      setReplies({ ...replies, [supportId]: replyText })
      setReplyText("")
      setEditingReply(null)
    }
  }

  const handleDeleteReply = (supportId: string) => {
    const newReplies = { ...replies }
    delete newReplies[supportId]
    setReplies(newReplies)
  }

  const handleCancelEdit = () => {
    setEditingReply(null)
    setReplyText("")
  }

  const toggleHidden = async (supportId: string) => {
    try {
      // Optimistic update
      const newHiddenStatus = !hiddenMessages[supportId]
      setHiddenMessages({ ...hiddenMessages, [supportId]: newHiddenStatus })

      // Call API to persist the change
      const response = await fetch(`/api/support/${supportId}/hide`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        // Revert optimistic update on error
        setHiddenMessages({ ...hiddenMessages, [supportId]: !newHiddenStatus })
        console.error('Failed to toggle hidden status')
      }
    } catch (error) {
      // Revert optimistic update on error
      setHiddenMessages({ ...hiddenMessages, [supportId]: !hiddenMessages[supportId] })
      console.error('Error toggling hidden status:', error)
    }
  }

  // No need to filter here - server already filtered based on isOwnProfile
  // Just use all supports passed from server
  const visibleSupports = supports

  if (supports.length === 0) {
    return (
      <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black mb-6">Recent Supporters</h2>
        <p className="text-xl font-bold text-gray-600">No supporters yet. Be the first!</p>
      </div>
    )
  }

  return (
    <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h2 className="text-3xl font-black mb-6">Recent Supporters</h2>
      <div className="space-y-6">
        {visibleSupports.map((support) => (
          <div key={support.id} className={`border-4 border-black rounded-2xl p-6 ${hiddenMessages[support.id] ? 'bg-gray-100 opacity-60' : 'bg-gray-50'} relative`}>
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="w-14 h-14 border-4 border-black">
                <AvatarImage src={support.supporter_avatar_url || "/placeholder.svg"} alt={support.supporter_name} />
                <AvatarFallback className="text-lg font-black bg-[#0000FF] text-white">
                  {support.supporter_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className="text-xl font-black">{support.supporter_name}</span>
                  <div className="flex items-center gap-1 bg-[#CCFF00] border-2 border-black rounded-full px-3 py-1">
                    <Coffee className="w-4 h-4" />
                    <span className="text-sm font-black">×{support.coffee_count}</span>
                  </div>

                  {/* Private Badge */}
                  {support.is_message_private && (
                    <div className="bg-[#0000FF] text-white px-3 py-1 rounded-full border-2 border-black text-xs font-black flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      PRIVATE
                    </div>
                  )}

                  {/* Hidden Badge */}
                  {isOwnProfile && hiddenMessages[support.id] && (
                    <div className="bg-gray-600 text-white px-3 py-1 rounded-full border-2 border-black text-xs font-black flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      HIDDEN
                    </div>
                  )}
                </div>
                {support.message && <p className="text-lg font-bold mb-2 leading-relaxed">{support.message}</p>}
                <p className="text-sm font-bold text-gray-600">
                  {support.created_at ? new Date(support.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : ''}
                </p>
              </div>
              <div className="text-right">
                {/* Only show amount to creator */}
                {isOwnProfile && (
                  <p className="text-2xl font-black">${Number(support.total_amount).toFixed(2)}</p>
                )}
              </div>
            </div>

            {/* Creator Reply Section */}
            {replies[support.id] && editingReply !== support.id && (
              <div className="ml-16 mb-4 bg-white border-2 border-black rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-10 h-10 border-2 border-black">
                    <AvatarImage src={creatorAvatar || "/placeholder.svg"} alt={creatorDisplayName} />
                    <AvatarFallback className="text-sm font-black bg-[#0000FF] text-white">
                      {creatorDisplayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-[#0000FF]">@{creatorUsername}</span>
                      {isOwnProfile && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditReply(support.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Edit reply"
                          >
                            <Pencil className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteReply(support.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Delete reply"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-base font-bold leading-relaxed">{replies[support.id]}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Reply Form */}
            {editingReply === support.id && (
              <div className="ml-16 mb-4">
                <div className="space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Edit your reply..."
                    className="border-4 border-black rounded-xl font-bold resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUpdateReply(support.id)}
                      className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-bold px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      Update Reply
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="font-bold px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Reply Button/Form and Hide Button */}
            {isOwnProfile && support.message && (
              <div className="ml-16 flex items-center justify-between">
                {/* Reply Button/Form */}
                <div>
                  {replyingTo === support.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="border-4 border-black rounded-xl font-bold resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReplySubmit(support.id)}
                          className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-bold px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                          Send Reply
                        </Button>
                        <Button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyText("")
                          }}
                          variant="outline"
                          className="font-bold px-6 py-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : !replies[support.id] ? (
                    <Button
                      onClick={() => setReplyingTo(support.id)}
                      variant="outline"
                      className="font-bold px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transition-all"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  ) : null}
                </div>

                {/* Hide/Unhide Button */}
                <Button
                  onClick={() => toggleHidden(support.id)}
                  variant="outline"
                  className="font-bold px-4 py-2 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white transition-all"
                  title={hiddenMessages[support.id] ? "Unhide message" : "Hide message"}
                >
                  {hiddenMessages[support.id] ? (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Show
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
