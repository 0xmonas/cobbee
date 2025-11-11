"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface DashboardActionsProps {
  profileUrl: string
  username: string
}

export function DashboardActions({ profileUrl, username }: DashboardActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShareOnX = () => {
    const text = `Support me on Cobbee! ☕ @cobbeefun`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  return (
    <>
      {/* Share Card */}
      <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-2xl font-black text-white mb-4">Share Your Page</h3>
        <p className="text-lg font-bold text-white mb-4 leading-relaxed">
          Get more supporters by sharing your page on social media
        </p>
        <div className="bg-white border-4 border-black rounded-xl p-3 mb-4">
          <p className="text-sm font-bold truncate">cobbee.fun/{username}</p>
        </div>

        {/* Copy Link Button */}
        <Button
          onClick={handleCopyLink}
          className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold text-lg py-6 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mb-3"
        >
          {copiedLink ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 mr-2" />
              Copy Link
            </>
          )}
        </Button>

        {/* Share on X Button */}
        <Button
          onClick={handleShareOnX}
          className="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-6 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 mr-2"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Share on X
        </Button>
      </div>
    </>
  )
}
