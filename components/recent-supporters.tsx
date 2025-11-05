import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Coffee } from "lucide-react"
import type { Support } from "@/lib/mock-data"

interface RecentSupportersProps {
  supports: Support[]
}

export function RecentSupporters({ supports }: RecentSupportersProps) {
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
        {supports.map((support) => (
          <div key={support.id} className="border-4 border-black rounded-2xl p-6 bg-gray-50">
            <div className="flex items-start gap-4">
              <Avatar className="w-14 h-14 border-4 border-black">
                <AvatarImage src={support.supporterAvatar || "/placeholder.svg"} alt={support.supporterName} />
                <AvatarFallback className="text-lg font-black bg-[#0000FF] text-white">
                  {support.supporterName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl font-black">{support.supporterName}</span>
                  <div className="flex items-center gap-1 bg-[#CCFF00] border-2 border-black rounded-full px-3 py-1">
                    <Coffee className="w-4 h-4" />
                    <span className="text-sm font-black">×{support.coffeeCount}</span>
                  </div>
                </div>
                {support.message && <p className="text-lg font-bold mb-2 leading-relaxed">{support.message}</p>}
                <p className="text-sm font-bold text-gray-600">{support.timestamp}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">${support.amount}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
