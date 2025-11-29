"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface CopyWalletButtonProps {
  walletAddress: string
}

export function CopyWalletButton({ walletAddress }: CopyWalletButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0"
      title="Copy wallet address"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  )
}
