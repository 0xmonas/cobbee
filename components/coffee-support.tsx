"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Coffee, HelpCircle, Wallet, CheckCircle, XCircle, Copy, Check, ExternalLink } from "lucide-react"
import type { Creator } from "@/lib/mock-data"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CoffeeSupportProps {
  creator: Creator
}

type PurchaseStep = "form" | "connect-wallet" | "summary" | "processing" | "success" | "error"

export function CoffeeSupport({ creator }: CoffeeSupportProps) {
  const [coffeeCount, setCoffeeCount] = useState(1)
  const [customAmount, setCustomAmount] = useState("")
  const [message, setMessage] = useState("")
  const [supporterName, setSupporterName] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>("form")
  const [copiedWallet, setCopiedWallet] = useState(false)
  const [copiedSupporterWallet, setCopiedSupporterWallet] = useState(false)
  const [txnHash, setTxnHash] = useState("")
  const [supporterWallet, setSupporterWallet] = useState("")

  const presetAmounts = [1, 3, 5]
  const isCustom = !presetAmounts.includes(coffeeCount)
  const totalAmount = isCustom
    ? (Number.parseInt(customAmount) || 0) * creator.coffeePrice
    : coffeeCount * creator.coffeePrice

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPurchaseStep("connect-wallet")
  }

  const handleConnectWallet = () => {
    // Simulate wallet connection
    // In production, this will use RainbowKit/Wagmi
    const mockWallet = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    setSupporterWallet(mockWallet)
    setPurchaseStep("summary")
  }

  const handleCopySupporterWallet = () => {
    if (supporterWallet) {
      navigator.clipboard.writeText(supporterWallet)
      setCopiedSupporterWallet(true)
      setTimeout(() => setCopiedSupporterWallet(false), 2000)
    }
  }

  const handlePurchase = () => {
    setPurchaseStep("processing")

    // Simulate wallet connection and transaction
    setTimeout(() => {
      // Randomly succeed or fail for demo
      const success = Math.random() > 0.2 // 80% success rate
      if (success) {
        // Generate fake transaction hash
        const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
        setTxnHash(hash)
      }
      setPurchaseStep(success ? "success" : "error")
    }, 3000)
  }

  const handleCopyWallet = () => {
    if (creator.walletAddress) {
      navigator.clipboard.writeText(creator.walletAddress)
      setCopiedWallet(true)
      setTimeout(() => setCopiedWallet(false), 2000)
    }
  }

  const handleDone = () => {
    setPurchaseStep("form")
    setCoffeeCount(1)
    setMessage("")
    setSupporterName("")
    setCustomAmount("")
    setIsPrivate(false)
    setTxnHash("")
  }

  // Processing Screen
  if (purchaseStep === "processing") {
    return (
      <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center py-12">
          <div className="inline-block animate-bounce mb-6">
            <Image src="/logo/logocobbee.svg" alt="Cobbee" width={64} height={64} className="w-16 h-16" />
          </div>
          <h3 className="text-3xl font-black mb-2">Processing payment...</h3>
          <p className="text-xl font-bold text-gray-600">Please confirm the transaction in your wallet</p>
        </div>
      </div>
    )
  }

  // Success Screen
  if (purchaseStep === "success") {
    return (
      <div className="bg-[#CCFF00] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-white border-4 border-black rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h3 className="text-3xl font-black mb-2">Payment Successful!</h3>
          <p className="text-xl font-bold text-gray-600 mb-6">Your support means the world to {creator.displayName}!</p>
          <div className="bg-gray-50 border-4 border-black rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-600">Amount:</span>
              <span className="text-2xl font-black">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-600">Coffees:</span>
              <span className="text-xl font-black">{isCustom ? Math.floor(totalAmount / creator.coffeePrice) : coffeeCount}</span>
            </div>
          </div>

          {/* Transaction Hash */}
          {txnHash && (
            <a
              href={`https://etherscan.io/tx/${txnHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-6 bg-[#0000FF] border-4 border-black rounded-xl p-4 hover:bg-[#0000CC] transition-colors"
            >
              <p className="text-sm font-bold text-white mb-2">Transaction Hash</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-mono font-bold text-white break-all">
                  {txnHash.slice(0, 10)}...{txnHash.slice(-8)}
                </p>
                <ExternalLink className="w-4 h-4 text-white flex-shrink-0" />
              </div>
            </a>
          )}

          <Button
            onClick={handleDone}
            className="w-full bg-[#0000FF] hover:bg-[#0000CC] text-white font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Done
          </Button>
        </div>
      </div>
    )
  }

  // Error Screen
  if (purchaseStep === "error") {
    return (
      <div className="bg-[#FF6B35] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="bg-white border-4 border-black rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="w-20 h-20 text-red-500" />
          </div>
          <h3 className="text-3xl font-black mb-2">Payment Failed</h3>
          <p className="text-xl font-bold text-gray-600 mb-6">
            The transaction was rejected or cancelled. Please try again.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => setPurchaseStep("summary")}
              className="flex-1 bg-[#0000FF] hover:bg-[#0000CC] text-white font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Try Again
            </Button>
            <Button
              onClick={handleDone}
              variant="outline"
              className="flex-1 bg-white hover:bg-gray-100 text-black hover:text-black font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Wallet Connection Screen
  if (purchaseStep === "connect-wallet") {
    return (
      <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black text-white mb-6">Connect Your Wallet</h2>

        <div className="bg-white border-4 border-black rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#CCFF00] rounded-full border-4 border-black mb-4">
              <Wallet className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black mb-2">Almost there!</h3>
            <p className="text-lg font-bold text-gray-600">
              Connect your wallet to complete the support
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {/* Summary Info */}
            <div className="bg-gray-50 border-4 border-black rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-gray-600">Supporting</span>
                <span className="text-lg font-black">{creator.displayName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-600">Amount</span>
                <span className="text-2xl font-black">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Info Notice */}
            <div className="bg-[#CCFF00] border-4 border-black rounded-xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-lg">💡</span>
                <div>
                  <p className="text-sm font-black mb-1">Web3 Wallet Required</p>
                  <p className="text-xs font-bold text-gray-700">
                    You'll need a Web3 wallet (like MetaMask) to make crypto donations. The connection is secure and decentralized.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => setPurchaseStep("form")}
              variant="outline"
              className="flex-1 bg-white hover:bg-gray-100 text-black hover:text-black font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Back
            </Button>
            <Button
              onClick={handleConnectWallet}
              className="flex-1 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
            >
              <Wallet className="w-6 h-6" />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Purchase Summary Screen
  if (purchaseStep === "summary") {
    return (
      <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black text-white mb-6">Review Your Support</h2>

        <div className="space-y-4 mb-6">
          {/* Creator Info */}
          <div className="bg-white border-4 border-black rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-600 mb-1">Supporting</p>
            <p className="text-xl font-black">{creator.displayName}</p>
          </div>

          {/* Amount Info */}
          <div className="bg-white border-4 border-black rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-600 mb-1">Amount</p>
            <p className="text-2xl font-black">${totalAmount.toFixed(2)}</p>
            <p className="text-sm font-bold text-gray-600">
              {isCustom ? `~${Math.floor(totalAmount / creator.coffeePrice)} coffees` : `${coffeeCount} coffee${coffeeCount > 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Supporter Name */}
          <div className="bg-white border-4 border-black rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-600 mb-1">Your Name</p>
            <p className="text-lg font-black">{supporterName}</p>
          </div>

          {/* Supporter Wallet */}
          {supporterWallet && (
            <div className="bg-white border-4 border-black rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-600 mb-2">Your Wallet Address</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-bold break-all flex-1">
                  {supporterWallet}
                </p>
                <button
                  onClick={handleCopySupporterWallet}
                  className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                  title="Copy wallet address"
                >
                  {copiedSupporterWallet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className="bg-white border-4 border-black rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-600 mb-1">
                Message {isPrivate && "(Private)"}
              </p>
              <p className="text-base font-bold">{message}</p>
            </div>
          )}

          {/* Creator Wallet */}
          {creator.walletAddress && (
            <div className="bg-white border-4 border-black rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-600 mb-2">Creator Wallet Address</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-bold break-all flex-1">
                  {creator.walletAddress}
                </p>
                <button
                  onClick={handleCopyWallet}
                  className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                  title="Copy wallet address"
                >
                  {copiedWallet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Gas Fee Notice */}
          <div className="bg-[#CCFF00] border-4 border-black rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-sm font-black mb-1">Network Fee</p>
                <p className="text-xs font-bold text-gray-700">
                  This transaction requires a small Ethereum gas fee (avg. $0.01 - $0.50) which goes to network validators, not to us.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => setPurchaseStep("form")}
            variant="outline"
            className="flex-1 bg-white hover:bg-gray-100 text-black hover:text-black font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Back
          </Button>
          <Button
            onClick={handlePurchase}
            className="flex-1 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="w-6 h-6" />
            Purchase
          </Button>
        </div>
      </div>
    )
  }

  // Form Screen (Default)
  return (
    <div className="bg-[#CCFF00] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
          <Coffee className="w-8 h-8 text-[#CCFF00]" />
        </div>
        <div>
          <h2 className="text-3xl font-black">Buy {creator.displayName.split(" ")[0]} a coffee</h2>
          <p className="text-lg font-bold">${creator.coffeePrice} per coffee</p>
        </div>
      </div>

      {purchaseStep === "form" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Coffee Amount Selection */}
          <div>
            <label className="text-xl font-black mb-3 block">How many coffees?</label>
            <div className="grid grid-cols-4 gap-3">
              {presetAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setCoffeeCount(amount)
                    setCustomAmount("")
                  }}
                  className={`
                    py-4 px-6 rounded-xl font-black text-xl border-4 border-black
                    transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                    ${coffeeCount === amount && !isCustom ? "bg-[#0000FF] text-white" : "bg-white text-black"}
                  `}
                >
                  {amount}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCoffeeCount(0)
                  setCustomAmount("")
                }}
                className={`
                  py-4 px-6 rounded-xl font-black text-xl border-4 border-black
                  transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                  hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                  ${isCustom ? "bg-[#0000FF] text-white" : "bg-white text-black"}
                `}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Custom Amount Input */}
          {isCustom && (
            <div>
              <label className="text-xl font-black mb-3 block">How many coffees? (max 100)</label>
              <Input
                type="number"
                min="1"
                max="100"
                step="1"
                value={customAmount}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = Number.parseInt(value)
                  if (value === "" || (numValue >= 1 && numValue <= 100)) {
                    setCustomAmount(value)
                  }
                }}
                placeholder="Enter number of coffees"
                className="text-xl font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              {customAmount && (
                <p className="text-lg font-bold text-gray-700 mt-2">
                  = ${(Number.parseInt(customAmount) * creator.coffeePrice).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Supporter Name */}
          <div>
            <label className="text-xl font-black mb-3 block">Your name</label>
            <Input
              type="text"
              value={supporterName}
              onChange={(e) => setSupporterName(e.target.value)}
              placeholder="Enter your name"
              required
              className="text-xl font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
          </div>

          {/* Message */}
          <div>
            <label className="text-xl font-black mb-3 block">Message (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Say something nice..."
              rows={4}
              className="text-lg font-bold border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
            />

            {/* Private Message Toggle */}
            {message && (
              <div className="mt-4 flex items-center gap-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-5 h-5 border-4 border-black rounded cursor-pointer accent-[#0000FF]"
                  />
                  <span className="text-lg font-bold">Make this message private</span>
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-gray-600 hover:text-black transition-colors">
                        <HelpCircle className="w-5 h-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-black text-white border-2 border-black px-4 py-2 rounded-lg font-bold max-w-xs">
                      <p>The message will be visible to you and the creator only</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          {/* Total & Submit */}
          <div className="bg-white border-4 border-black rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-black">Total</span>
              <span className="text-4xl font-black">${totalAmount.toFixed(2)}</span>
            </div>
            <Button
              type="submit"
              disabled={totalAmount <= 0 || !supporterName}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A25] text-white font-black text-2xl py-7 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Support ${totalAmount.toFixed(2)}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
