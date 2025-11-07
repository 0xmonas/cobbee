"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Coffee } from "lucide-react"

const mockSupports = [
  {
    id: "1",
    name: "Alex",
    amount: 25,
    coffeeCount: 25,
    message: "Keep up the great work! Your content has been really helpful.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4"
  },
  {
    id: "2",
    name: "Cathy G",
    amount: 3,
    coffeeCount: 1,
    message: "Thanks for all you do!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Cathy&backgroundColor=c0aede"
  },
  {
    id: "3",
    name: "Tony",
    amount: 9,
    coffeeCount: 3,
    message: "Love your work, keep it up! 🚀",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tony&backgroundColor=ffd5dc"
  },
]

export function SupportDemo() {
  const [coffeeCount, setCoffeeCount] = useState(3)
  const [message, setMessage] = useState("")

  return (
    <section id="support" className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            Give your audience an easy way to say thanks.
          </h2>
          <p className="text-xl font-bold text-gray-700 max-w-3xl mx-auto">
            Cobbee makes supporting fun and easy. In just a couple of taps, your fans can make the payment
            (buy you a coffee) and leave a message.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: Recent Supports */}
          <div className="space-y-4">
            {mockSupports.map((support, index) => (
              <motion.div
                key={support.id}
                className="border-4 border-black rounded-2xl p-6 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="w-14 h-14 border-4 border-black">
                    <AvatarImage src={support.avatar} alt={support.name} />
                    <AvatarFallback className="text-lg font-black bg-[#0000FF] text-white">
                      {support.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-black">{support.name}</span>
                      <div className="flex items-center gap-1 bg-[#CCFF00] border-2 border-black rounded-full px-3 py-1">
                        <Coffee className="w-4 h-4" />
                        <span className="text-sm font-black">×{support.coffeeCount}</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold mb-2 leading-relaxed">{support.message}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">${support.amount}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: Support Widget - Compact version like CoffeeSupport */}
          <motion.div
            className="bg-[#CCFF00] border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-black w-16 h-16 rounded-full flex items-center justify-center border-4 border-black">
                <Coffee className="w-8 h-8 text-[#CCFF00]" />
              </div>
              <div>
                <h3 className="text-3xl font-black">Buy Sarah a coffee</h3>
                <p className="text-lg font-bold">$3 per coffee</p>
              </div>
            </div>

            <form className="space-y-6">
              {/* Coffee Count Selector */}
              <div>
                <label className="text-lg font-black mb-3 block">Number of coffees</label>
                <div className="flex gap-3">
                  {[1, 3, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCoffeeCount(num)}
                      className={`flex-1 py-4 rounded-xl border-4 border-black font-black text-xl transition-all ${
                        coffeeCount === num
                          ? "bg-black text-[#CCFF00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          : "bg-white hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      }`}
                    >
                      <Coffee className="w-5 h-5 inline mr-2" />×{num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-lg font-black mb-3 block">Message (optional)</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something nice..."
                  className="border-4 border-black rounded-xl font-bold resize-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white"
                  rows={3}
                />
              </div>

              {/* Support Button */}
              <Button
                type="button"
                className="w-full bg-[#0000FF] hover:bg-[#0000DD] text-white font-black text-xl py-6 rounded-xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Support ${coffeeCount * 3}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
