"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Coffee } from "lucide-react"
import type { Creator } from "@/lib/mock-data"

interface CoffeeSupportProps {
  creator: Creator
}

export function CoffeeSupport({ creator }: CoffeeSupportProps) {
  const [coffeeCount, setCoffeeCount] = useState(1)
  const [customAmount, setCustomAmount] = useState("")
  const [message, setMessage] = useState("")
  const [supporterName, setSupporterName] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const presetAmounts = [1, 3, 5]
  const isCustom = !presetAmounts.includes(coffeeCount)
  const totalAmount = isCustom ? Number.parseFloat(customAmount) || 0 : coffeeCount * creator.coffeePrice

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setCoffeeCount(1)
      setMessage("")
      setSupporterName("")
      setCustomAmount("")
    }, 3000)
  }

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

      {showSuccess ? (
        <div className="bg-white border-4 border-black rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">☕</div>
          <h3 className="text-3xl font-black mb-2">Thank you!</h3>
          <p className="text-xl font-bold">Your support means the world!</p>
        </div>
      ) : (
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
              <label className="text-xl font-black mb-3 block">Custom amount ($)</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-xl font-bold border-4 border-black rounded-xl h-14 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
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
