"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Coffee, HelpCircle, Wallet, CheckCircle, XCircle, Copy, Check, ExternalLink, Loader2 } from "lucide-react"
import Image from "next/image"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { validateSupporterName, validateSupportMessage } from "@/lib/utils/validation"
import type { Database } from "@/lib/types/database.types"
import { useAppKit, useAppKitAccount, useDisconnect, useAppKitNetwork } from '@reown/appkit/react'
import { createX402Fetch } from "@/lib/x402-client"
import { isTestnet, getX402Config } from "@/lib/x402-config"
import { createPublicClient, http, formatUnits } from "viem"
import { useToast } from "@/hooks/use-toast"
import type { Milestone } from "@/lib/mock-data"
import { FlaskConical } from "lucide-react"
import { MilestoneTestTube } from "./milestone-test-tube"

type User = Database['public']['Tables']['users']['Row']

interface CoffeeSupportProps {
  creator: User
  milestones?: Milestone[]
}

type PurchaseStep = "form" | "connect-wallet" | "summary" | "processing" | "success" | "error"

export function CoffeeSupport({ creator, milestones = [] }: CoffeeSupportProps) {
  // Reown AppKit hooks for supporter wallet
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { disconnect } = useDisconnect()
  const { toast } = useToast()

  const [coffeeCount, setCoffeeCount] = useState(1)
  const [customAmount, setCustomAmount] = useState("")
  const [message, setMessage] = useState("")
  const [supporterName, setSupporterName] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [purchaseStep, setPurchaseStep] = useState<PurchaseStep>("form")
  const [copiedWallet, setCopiedWallet] = useState(false)
  const [copiedSupporterWallet, setCopiedSupporterWallet] = useState(false)
  const [txnHash, setTxnHash] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null)

  // Filter active milestones
  const activeMilestones = milestones.filter(
    (m) => m.is_active && !m.deleted_at && m.status === 'active'
  )

  const presetAmounts = [1, 3, 5]
  const isCustom = !presetAmounts.includes(coffeeCount)
  const totalAmount = isCustom
    ? (Number.parseInt(customAmount) || 0) * Number(creator.coffee_price)
    : coffeeCount * Number(creator.coffee_price)

  // Fetch USDC balance when wallet is connected
  useEffect(() => {
    const fetchUsdcBalance = async () => {
      if (!address || !isConnected) {
        setUsdcBalance(null)
        return
      }

      // ⚠️ CRITICAL: Check if user is on correct network
      const x402Config = getX402Config()
      if (chainId && chainId !== x402Config.chainId) {
        setPurchaseStep("error")
        setUsdcBalance(null)
        toast({
          title: "Wrong Network",
          description: `Please switch to ${x402Config.networkName} (Chain ID: ${x402Config.chainId})`,
          variant: "destructive",
        })
        return
      }

      setIsLoadingBalance(true)

      try {
        const publicClient = createPublicClient({
          chain: {
            id: x402Config.chainId,
            name: x402Config.networkName,
            network: x402Config.network,
            nativeCurrency: {
              decimals: 18,
              name: 'Ether',
              symbol: 'ETH',
            },
            rpcUrls: {
              default: { http: [x402Config.rpcUrl] },
              public: { http: [x402Config.rpcUrl] },
            },
          },
          transport: http(x402Config.rpcUrl),
        })

        // USDC ERC-20 ABI for balanceOf function
        const balanceOfAbi = [{
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: 'balance', type: 'uint256' }],
        }] as const

        // Read USDC balance
        const balance = await publicClient.readContract({
          address: x402Config.usdcAddress as `0x${string}`,
          abi: balanceOfAbi,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        })

        // Format balance (USDC has 6 decimals)
        const formattedBalance = formatUnits(balance, 6)
        setUsdcBalance(formattedBalance)
      } catch (error) {
        setUsdcBalance(null)
      } finally {
        setIsLoadingBalance(false)
      }
    }

    fetchUsdcBalance()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected])

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

  const handleConnectWallet = async () => {
    try {
      await open()
      if (isConnected && address) {
        setPurchaseStep("summary")
      }
    } catch (error) {
      // Silent error handling
    }
  }

  const handleDisconnectWallet = async () => {
    try {
      await disconnect()
      setPurchaseStep("connect-wallet")
    } catch (error) {
      // Silent error handling
    }
  }

  const handleCopySupporterWallet = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopiedSupporterWallet(true)
      setTimeout(() => setCopiedSupporterWallet(false), 2000)
    }
  }

  const handlePurchase = async () => {
    setPurchaseStep("processing")

    if (!address) {
      setPurchaseStep("error")
      return
    }

    try {
      const x402Fetch = createX402Fetch(address as `0x${string}`)

      const response = await x402Fetch('/api/support/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creator.id,
          supporter_name: supporterName,
          coffee_count: isCustom ? Math.floor(totalAmount / Number(creator.coffee_price)) : coffeeCount,
          message: message || null,
          is_private: isPrivate,
          milestone_id: selectedMilestoneId || null,
        })
      })

      if (!response.ok) {
        setPurchaseStep("error")
        return
      }

      const result = await response.json()

      const transactionHash = result.payment?.transactionHash || result.support?.transaction_hash

      if (transactionHash) {
        setTxnHash(transactionHash)
      }

      if (result.creator?.thank_you_message) {
        setThankYouMessage(result.creator.thank_you_message)
      }

      setPurchaseStep("success")

    } catch (error) {
      setPurchaseStep("error")
    }
  }

  const handleCopyWallet = () => {
    if (creator.wallet_address) {
      navigator.clipboard.writeText(creator.wallet_address)
      setCopiedWallet(true)
      setTimeout(() => setCopiedWallet(false), 2000)
    }
  }

  const handleDone = async () => {
    if (isConnected) {
      await disconnect()
    }

    setPurchaseStep("form")
    setCoffeeCount(1)
    setMessage("")
    setSupporterName("")
    setCustomAmount("")
    setIsPrivate(false)
    setSelectedMilestoneId(null)
    setTxnHash("")
    setThankYouMessage(null)
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
          <p className="text-xl font-bold text-gray-600 mb-6">
            {thankYouMessage || creator.thank_you_message || `Your support means the world to ${creator.display_name}!`}
          </p>
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
              href={
                isTestnet()
                  ? `https://sepolia.basescan.org/tx/${txnHash}`
                  : `https://basescan.org/tx/${txnHash}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-6 bg-[#0000FF] border-4 border-black rounded-xl p-4 hover:bg-[#0000CC] transition-colors"
            >
              <p className="text-sm font-bold text-white mb-2">Transaction Hash</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-mono font-bold text-white break-all">
                  {txnHash.slice(0, 10)}...{txnHash.slice(-8)}
                </p>
                <ExternalLink className="w-4 h-4 text-white shrink-0" />
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
          {address && isConnected && (
            <div className="bg-white border-4 border-black rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-600">Your Wallet Address</p>
                <div className="flex items-center gap-2 bg-green-100 border-2 border-green-600 rounded-lg px-3 py-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-bold text-green-600">Connected</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-mono font-bold break-all flex-1">
                  {address}
                </p>
                <button
                  onClick={handleCopySupporterWallet}
                  className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0"
                  title="Copy wallet address"
                >
                  {copiedSupporterWallet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* USDC Balance Display */}
              <div className="bg-[#CCFF00] border-2 border-black rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-700">USDC Balance:</span>
                    {isLoadingBalance ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : usdcBalance !== null ? (
                      <span className="text-lg font-black">
                        {Number(usdcBalance).toFixed(2)} USDC
                      </span>
                    ) : (
                      <span className="text-sm font-bold text-gray-600">Unable to fetch</span>
                    )}
                  </div>
                  {usdcBalance !== null && Number(usdcBalance) < totalAmount && (
                    <div className="flex items-center gap-1 text-red-600">
                      <span className="text-xs font-bold">⚠️ Low balance</span>
                    </div>
                  )}
                </div>
                {usdcBalance !== null && Number(usdcBalance) < totalAmount && (
                  <p className="text-xs font-bold text-red-700 mt-1">
                    Your balance is insufficient for this transaction
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDisconnectWallet}
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm py-2 px-3 rounded-lg border-2 border-red-600 transition-all"
                >
                  Disconnect
                </button>
                <button
                  onClick={handleConnectWallet}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-sm py-2 px-3 rounded-lg border-2 border-blue-600 transition-all"
                >
                  Use Different Wallet
                </button>
              </div>
            </div>
          )}

          {/* Selected Milestone */}
          {selectedMilestoneId && (
            <div className="bg-white border-4 border-black rounded-2xl p-4">
              <p className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Contributing to Milestone
              </p>
              {(() => {
                const selectedMilestone = activeMilestones.find(m => m.id === selectedMilestoneId)
                if (!selectedMilestone) return null
                return (
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-black shrink-0"
                      style={{ backgroundColor: selectedMilestone.color }}
                    />
                    <div>
                      <p className="text-lg font-black">{selectedMilestone.title}</p>
                      <p className="text-xs font-bold text-gray-600">
                        ${selectedMilestone.current_amount.toFixed(2)} / ${selectedMilestone.goal_amount.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              })()}
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
                  className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all shrink-0"
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
                  This transaction requires a small Base network fee (typically under $0.01) which goes to network validators, not to us.
                  {isTestnet() && " You're on Base Sepolia testnet."}
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

          {activeMilestones.length > 0 && (
            <div>
              <label className="text-xl font-black mb-6 flex items-center gap-2">
                <FlaskConical className="w-6 h-6" />
                Support a milestone (optional)
              </label>
              <div className="flex flex-row justify-center gap-4 md:gap-12 overflow-x-auto pb-2">
                {activeMilestones.map((milestone) => (
                  <button
                    key={milestone.id}
                    type="button"
                    onClick={() => {
                      setSelectedMilestoneId(selectedMilestoneId === milestone.id ? null : milestone.id)
                    }}
                    className={`
                      transition-all duration-200 cursor-pointer rounded-3xl p-4 shrink-0
                      ${selectedMilestoneId === milestone.id
                        ? 'border-4 border-[#0000FF] bg-[#CCFF00] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] scale-105'
                        : 'border-4 border-transparent hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:scale-105'
                      }
                    `}
                  >
                    <MilestoneTestTube milestone={milestone} />
                  </button>
                ))}
              </div>
            </div>
          )}

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
