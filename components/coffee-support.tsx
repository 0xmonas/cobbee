"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Coffee, HelpCircle, Wallet, CheckCircle, XCircle, Copy, Check, ExternalLink } from "lucide-react"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { validateSupporterName, validateSupportMessage } from "@/lib/utils/validation"
import type { Database } from "@/lib/types/database.types"

type User = Database['public']['Tables']['users']['Row']

interface CoffeeSupportProps {
  creator: User
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
  const [nameError, setNameError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)

  const presetAmounts = [1, 3, 5]
  const isCustom = !presetAmounts.includes(coffeeCount)
  const totalAmount = isCustom
    ? (Number.parseInt(customAmount) || 0) * Number(creator.coffee_price)
    : coffeeCount * Number(creator.coffee_price)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate supporter name
    const nameValidationError = validateSupporterName(supporterName)
    setNameError(nameValidationError)

    // Validate message (if provided)
    const messageValidationError = validateSupportMessage(message)
    setMessageError(messageValidationError)

    // Only proceed if no errors
    if (!nameValidationError && !messageValidationError) {
      setPurchaseStep("connect-wallet")
    }
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
    if (creator.wallet_address) {
      navigator.clipboard.writeText(creator.wallet_address)
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
          <p className="text-xl font-bold text-gray-600 mb-6">Your support means the world to {creator.display_name}!</p>
          <div className="bg-gray-50 border-4 border-black rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-600">Amount:</span>
              <span className="text-2xl font-black">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-600">Coffees:</span>
              <span className="text-xl font-black">{isCustom ? Math.floor(totalAmount / Number(creator.coffee_price)) : coffeeCount}</span>
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

          {/* Share on X Button */}
          <Button
            onClick={() => {
              const coffeeAmount = isCustom ? Math.floor(totalAmount / Number(creator.coffee_price)) : coffeeCount
              const text = `I just sent ${creator.display_name} ${coffeeAmount} coffee${coffeeAmount > 1 ? 's' : ''} on Cobbee! ☕ Check out their profile! @cobbeefun`
              const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(`https://cobbee.fun/${creator.username}`)}`
              window.open(url, '_blank', 'width=550,height=420')
            }}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-6 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mb-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </Button>

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
                <span className="text-lg font-black">{creator.display_name}</span>
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
            <p className="text-xl font-black">{creator.display_name}</p>
          </div>

          {/* Amount Info */}
          <div className="bg-white border-4 border-black rounded-2xl p-4">
            <p className="text-sm font-bold text-gray-600 mb-1">Amount</p>
            <p className="text-2xl font-black">${totalAmount.toFixed(2)}</p>
            <p className="text-sm font-bold text-gray-600">
              {isCustom ? `~${Math.floor(totalAmount / Number(creator.coffee_price))} coffees` : `${coffeeCount} coffee${coffeeCount > 1 ? 's' : ''}`}
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
          {creator.wallet_address && (
            <div className="bg-white border-4 border-black rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-600 mb-2">Creator Wallet Address</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-bold break-all flex-1">
                  {creator.wallet_address}
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
          <h2 className="text-3xl font-black">Buy {creator.display_name.split(" ")[0]} a coffee</h2>
          <p className="text-lg font-bold">${Number(creator.coffee_price)} per coffee</p>
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
                    hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2
                    ${coffeeCount === amount && !isCustom ? "bg-[#0000FF] text-white" : "bg-white text-black"}
                  `}
                >
                  <Coffee className="hidden sm:inline w-5 h-5" />
                  <span>{amount}x</span>
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
                  hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center
                  ${isCustom ? "bg-[#0000FF] text-white" : "bg-white text-black"}
                `}
              >
                <span className="hidden sm:inline">Custom</span>
                <span className="sm:hidden text-2xl">+</span>
              </button>
            </div>
          </div>

          {/* Custom Amount Input */}
          {isCustom && (
            <div>
              <label className="text-xl font-black mb-3 block">How many cobbees? (max 100)</label>
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
                  = ${(Number.parseInt(customAmount) * Number(creator.coffee_price)).toFixed(2)}
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
              onChange={(e) => {
                setSupporterName(e.target.value)
                // Clear error on change
                if (nameError) {
                  const error = validateSupporterName(e.target.value)
                  setNameError(error)
                }
              }}
              onBlur={() => {
                // Validate on blur
                const error = validateSupporterName(supporterName)
                setNameError(error)
              }}
              placeholder="Enter your name"
              required
              className="text-xl font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            />
            {nameError && (
              <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2 mt-2">
                {nameError}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="text-xl font-black mb-3 block">Message (optional)</label>
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                // Clear error on change
                if (messageError) {
                  const error = validateSupportMessage(e.target.value)
                  setMessageError(error)
                }
              }}
              onBlur={() => {
                // Validate on blur
                const error = validateSupportMessage(message)
                setMessageError(error)
              }}
              placeholder="Say something nice..."
              rows={4}
              className="text-lg font-bold border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] resize-none"
            />
            <p className="text-sm text-gray-600 font-bold mt-2">{message.length} / 500 characters</p>
            {messageError && (
              <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2 mt-2">
                {messageError}
              </p>
            )}

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
