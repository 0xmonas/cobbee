"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  DollarSign,
  Wallet,
  MessageSquare,
  TrendingUp,
  Search,
  Download,
  ExternalLink,
  Filter,
  X,
} from "lucide-react"
import { mockSupports } from "@/lib/mock-data"

export default function PaymentSettingsPage() {
  const [coffeePrice, setCoffeePrice] = useState("5")
  const [ethereumAddress, setEthereumAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
  const [thankYouMessage, setThankYouMessage] = useState(
    "Thank you so much for your support! Your contribution helps me continue creating content. ☕",
  )

  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [dateFilter, setDateFilter] = useState("all") // all, today, week, month

  // Get all payments for the current user (using creator ID "1" as example)
  const allPayments = mockSupports["1"] || []

  const filteredPayments = allPayments.filter((payment) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      payment.supporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.txHash.toLowerCase().includes(searchQuery.toLowerCase())

    // Amount filter
    const matchesAmount =
      (minAmount === "" || payment.amount >= Number.parseFloat(minAmount)) &&
      (maxAmount === "" || payment.amount <= Number.parseFloat(maxAmount))

    return matchesSearch && matchesAmount
  })

  const totalEarnings = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalCoffees = filteredPayments.reduce((sum, payment) => sum + payment.coffeeCount, 0)

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Payment settings saved successfully!")
  }

  const handleExport = () => {
    const csvContent = [
      ["Date", "Supporter", "Amount", "Coffees", "Message", "Transaction Hash"],
      ...filteredPayments.map((p) => [
        p.timestamp,
        p.supporterName,
        `$${p.amount}`,
        p.coffeeCount,
        p.message || "No message",
        p.txHash,
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
    setDateFilter("all")
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
            <DollarSign className="w-6 h-6" />
            <h2 className="text-2xl font-black">Coffee Price</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="coffeePrice" className="text-lg font-bold">
                  Price per Coffee
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">$</span>
                  <Input
                    id="coffeePrice"
                    type="number"
                    min="1"
                    value={coffeePrice}
                    onChange={(e) => setCoffeePrice(e.target.value)}
                    className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00] w-32"
                  />
                  <span className="text-lg font-bold">per coffee</span>
                </div>
                <p className="text-sm text-gray-600 font-bold">
                  This is the base price supporters will pay for one coffee
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
                <Input
                  id="ethereumAddress"
                  type="text"
                  value={ethereumAddress}
                  onChange={(e) => setEthereumAddress(e.target.value)}
                  className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00] font-mono"
                  placeholder="0x..."
                />
                <p className="text-sm text-gray-600 font-bold">
                  All payments will be sent to this Ethereum address. Make sure it's correct!
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
                  onChange={(e) => setThankYouMessage(e.target.value)}
                  className="border-4 border-black text-lg p-6 focus:ring-4 focus:ring-[#CCFF00] min-h-[150px]"
                  placeholder="Write a message that supporters will see after they support you..."
                />
                <p className="text-sm text-gray-600 font-bold">
                  This message will be displayed to supporters after they complete their payment
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
                <p className="text-3xl font-black">${totalEarnings}</p>
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search by name, message, or transaction hash..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-4 border-black pl-12 text-lg p-6 focus:ring-4 focus:ring-[#CCFF00]"
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
                <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                          <img
                            src={payment.supporterAvatar || "/placeholder.svg"}
                            alt={payment.supporterName}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 border-black object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="font-black text-base md:text-lg truncate">{payment.supporterName}</p>
                              <span className="bg-[#CCFF00] border-2 border-black px-2 md:px-3 py-1 text-xs md:text-sm font-bold rounded-full flex-shrink-0">
                                {payment.coffeeCount}x ☕
                              </span>
                            </div>
                            {payment.message && (
                              <p className="text-gray-700 font-bold mb-2 bg-gray-50 border-2 border-gray-300 p-2 md:p-3 rounded-lg text-sm md:text-base break-words">
                                "{payment.message}"
                              </p>
                            )}
                            <p className="text-xs md:text-sm text-gray-500 font-bold mb-2">{payment.timestamp}</p>
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-xs font-bold text-gray-500 flex-shrink-0">TXN:</span>
                              <a
                                href={`https://etherscan.io/tx/${payment.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono font-bold text-[#0000FF] hover:text-[#0000CC] underline flex items-center gap-1 hover:gap-2 transition-all truncate"
                              >
                                <span className="truncate">{payment.txHash.slice(0, 8)}...{payment.txHash.slice(-6)}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                        </div>
                        <div className="text-left md:text-right flex-shrink-0">
                          <p className="text-xl md:text-2xl font-black text-[#0000FF] whitespace-nowrap">${payment.amount}</p>
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
            className="bg-[#0000FF] hover:bg-[#0000CC] text-white border-4 border-black text-lg font-bold px-8 py-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Save Payment Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
