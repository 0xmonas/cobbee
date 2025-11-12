"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Wallet,
  MessageSquare,
  TrendingUp,
  Search,
  Download,
  ExternalLink,
  Filter,
  X,
  Coffee,
  Copy,
  Check,
} from "lucide-react"
import type { Database } from "@/lib/types/database.types"
import { validateCoffeePrice, validateThankYouMessage } from "@/lib/utils/validation"

type User = Database['public']['Tables']['users']['Row']
type Support = Database['public']['Tables']['supports']['Row']

interface PaymentSettingsFormProps {
  user: User
  supports: Support[]
}

export function PaymentSettingsForm({ user, supports }: PaymentSettingsFormProps) {
  const router = useRouter()
  const [coffeePrice, setCoffeePrice] = useState(user.coffee_price?.toString() || "0.50")
  const [ethereumAddress] = useState(user.wallet_address || "")
  const [copiedWallet, setCopiedWallet] = useState(false)
  const [thankYouMessage, setThankYouMessage] = useState(
    user.thank_you_message || "Thank you so much for your support! Your contribution helps me continue creating content. ☕",
  )

  // Validation and loading states
  const [priceError, setPriceError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(ethereumAddress)
    setCopiedWallet(true)
    setTimeout(() => setCopiedWallet(false), 2000)
  }

  const filteredPayments = supports.filter((payment) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      payment.supporter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.message && payment.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
      payment.tx_hash.toLowerCase().includes(searchQuery.toLowerCase())

    // Amount filter
    const matchesAmount =
      (minAmount === "" || Number(payment.total_amount) >= Number.parseFloat(minAmount)) &&
      (maxAmount === "" || Number(payment.total_amount) <= Number.parseFloat(maxAmount))

    return matchesSearch && matchesAmount
  })

  const totalEarnings = filteredPayments.reduce((sum, payment) => sum + Number(payment.total_amount), 0)
  const totalCoffees = filteredPayments.reduce((sum, payment) => sum + payment.coffee_count, 0)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSaveSuccess(false)

    // Validate coffee price
    const priceValidation = validateCoffeePrice(coffeePrice)
    setPriceError(priceValidation)

    // Validate thank you message
    const messageValidation = validateThankYouMessage(thankYouMessage)
    setMessageError(messageValidation)

    // Stop if validation fails
    if (priceValidation || messageValidation) {
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/user/payment-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coffeePrice: parseFloat(coffeePrice),
          thankYouMessage: thankYouMessage.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        // Set field-specific error if provided
        if (result.field === 'coffeePrice') {
          setPriceError(result.error)
        } else if (result.field === 'thankYouMessage') {
          setMessageError(result.error)
        } else {
          setPriceError(result.error || 'Failed to save settings')
        }
        setIsSubmitting(false)
        return
      }

      // Success!
      setSaveSuccess(true)
      setIsSubmitting(false)

      // Hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)

      // Refresh page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Save settings error:', error)
      setPriceError('Failed to save settings. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      ["Date", "Supporter", "Amount", "Coffees", "Message", "Transaction Hash"],
      ...filteredPayments.map((p) => [
        p.created_at || "",
        p.supporter_name,
        `$${Number(p.total_amount)}`,
        p.coffee_count,
        p.message || "No message",
        p.tx_hash,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setMinAmount("")
    setMaxAmount("")
  }

  // Format time ago
  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Unknown"
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
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
            <h1 className="text-2xl md:text-3xl font-black text-white">Payment Settings</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl space-y-8">
        {/* Coffee Price Section */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#CCFF00] border-b-4 border-black p-4 flex items-center gap-3">
            <span className="text-2xl font-black">$</span>
            <h2 className="text-2xl font-black">Coffee Price</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {saveSuccess && (
                <div className="bg-green-500 text-white p-4 rounded-xl border-4 border-black">
                  <div className="flex items-center gap-2">
                    <Check className="w-6 h-6" />
                    <span className="font-bold">Payment settings saved successfully!</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="coffeePrice" className="text-lg font-bold">
                  Price per Coffee
                </Label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const currentPrice = parseFloat(coffeePrice) || 0.10
                      const newPrice = Math.max(0.10, currentPrice - 0.10)
                      setCoffeePrice(newPrice.toFixed(2))
                      setPriceError(null)
                    }}
                    disabled={parseFloat(coffeePrice) <= 0.10 || isSubmitting}
                    className="bg-[#FF6B35] hover:bg-[#E55A25] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-2xl w-12 h-12 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    -
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black">${coffeePrice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const currentPrice = parseFloat(coffeePrice) || 0.10
                      const newPrice = Math.min(1.00, currentPrice + 0.10)
                      setCoffeePrice(newPrice.toFixed(2))
                      setPriceError(null)
                    }}
                    disabled={parseFloat(coffeePrice) >= 1.00 || isSubmitting}
                    className="bg-[#0000FF] hover:bg-[#0000CC] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black text-2xl w-12 h-12 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    +
                  </button>
                  <span className="text-lg font-bold text-gray-600">per coffee</span>
                </div>
                {priceError && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {priceError}
                  </p>
                )}
                <p className="text-sm text-gray-600 font-bold">
                  This is the base price supporters will pay for one coffee. Currently only $0.10 - $1.00 is supported.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Ethereum Wallet Section */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#0000FF] border-b-4 border-black p-4 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-black text-white">Ethereum Wallet</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ethereumAddress" className="text-lg font-bold">
                  Ethereum Address
                </Label>
                <div className="relative">
                  <Input
                    id="ethereumAddress"
                    type="text"
                    value={ethereumAddress}
                    readOnly
                    className="border-4 border-black text-lg p-6 pr-14 font-mono bg-white cursor-default"
                  />
                  <Button
                    type="button"
                    onClick={handleCopyWallet}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold px-3 py-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    {copiedWallet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 font-bold">
                  All payments will be sent to this Ethereum address. This is your connected wallet.
                </p>
              </div>
              <div className="bg-[#CCFF00] border-4 border-black p-4 rounded-lg">
                <p className="font-bold text-sm">
                  💡 <strong>Tip:</strong> We currently support Ethereum-based payments only. Make sure your wallet
                  supports ETH and ERC-20 tokens.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Thank You Message Section */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#FF6B35] border-b-4 border-black p-4 flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-black text-white">Thank You Message</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="thankYouMessage" className="text-lg font-bold">
                  Custom Message for Supporters
                </Label>
                <Textarea
                  id="thankYouMessage"
                  value={thankYouMessage}
                  onChange={(e) => {
                    setThankYouMessage(e.target.value)
                    // Clear error on change
                    if (messageError) {
                      const error = validateThankYouMessage(e.target.value)
                      setMessageError(error)
                    }
                  }}
                  onBlur={() => {
                    const error = validateThankYouMessage(thankYouMessage)
                    setMessageError(error)
                  }}
                  className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00] min-h-[150px]"
                  placeholder="Write a message that supporters will see after they support you..."
                  disabled={isSubmitting}
                />
                {messageError && (
                  <p className="text-sm font-bold text-white bg-red-600 border-2 border-black rounded-lg px-3 py-2">
                    {messageError}
                  </p>
                )}
                <p className="text-sm text-gray-600 font-bold">
                  {thankYouMessage.length} / 500 characters. This message will be displayed to supporters after they complete their payment.
                </p>
              </div>
              <div className="border-4 border-black p-6 rounded-lg bg-gray-50">
                <p className="text-sm font-bold mb-2">Preview:</p>
                <div className="bg-white border-2 border-gray-300 p-4 rounded-lg">
                  <p className="text-base">{thankYouMessage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#0000FF] border-b-4 border-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-black text-white">Payment History</h2>
            </div>
            <Button
              onClick={handleExport}
              className="bg-[#CCFF00] hover:bg-[#B8E600] text-black border-4 border-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="p-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="border-4 border-black bg-[#CCFF00] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-bold mb-1">Total Earnings</p>
                <p className="text-3xl font-black">${totalEarnings.toFixed(2)}</p>
              </div>
              <div className="border-4 border-black bg-[#FF6B35] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-bold mb-1 text-white">Total Coffees</p>
                <p className="text-3xl font-black text-white">{totalCoffees}</p>
              </div>
              <div className="border-4 border-black bg-[#0000FF] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-sm font-bold mb-1 text-white">Total Payments</p>
                <p className="text-3xl font-black text-white">{filteredPayments.length}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search by name, message, or transaction hash..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-4 border-black pl-14 pr-6 py-4 text-lg font-bold focus:ring-4 focus:ring-[#CCFF00]"
                  />
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="border-4 border-black font-bold text-lg px-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="border-4 border-black bg-gray-50 p-6 rounded-lg space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black">Filter Payments</h3>
                    <Button
                      onClick={handleClearFilters}
                      variant="ghost"
                      className="font-bold text-sm hover:bg-gray-200"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Min Amount ($)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="border-4 border-black p-4 focus:ring-4 focus:ring-[#CCFF00]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold">Max Amount ($)</Label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="border-4 border-black p-4 focus:ring-4 focus:ring-[#CCFF00]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">
                  {filteredPayments.length} Payment{filteredPayments.length !== 1 ? "s" : ""}
                </h3>
              </div>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 border-4 border-dashed border-gray-300 rounded-lg">
                  <p className="text-lg font-bold text-gray-500">No payments found</p>
                  <p className="text-sm text-gray-400 font-bold">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border-4 border-black rounded-2xl p-6 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-14 h-14 border-4 border-black">
                          <AvatarImage src={payment.supporter_avatar_url || undefined} alt={payment.supporter_name} />
                          <AvatarFallback className="text-lg font-black bg-[#0000FF] text-white">
                            {payment.supporter_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl font-black">{payment.supporter_name}</span>
                            <div className="flex items-center gap-1 bg-[#CCFF00] border-2 border-black rounded-full px-3 py-1">
                              <Coffee className="w-4 h-4" />
                              <span className="text-sm font-black">×{payment.coffee_count}</span>
                            </div>
                          </div>
                          {payment.message && (
                            <p className="text-lg font-bold mb-2 leading-relaxed">{payment.message}</p>
                          )}
                          <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                            <span>{formatTimeAgo(payment.created_at)}</span>
                            <span>•</span>
                            <a
                              href={`https://etherscan.io/tx/${payment.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[#0000FF] hover:text-[#0000CC] underline flex items-center gap-1 transition-colors"
                            >
                              TXN: {payment.tx_hash.slice(0, 6)}...{payment.tx_hash.slice(-4)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">${Number(payment.total_amount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSaveSettings}
            disabled={isSubmitting}
            className="bg-[#0000FF] hover:bg-[#0000CC] text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
