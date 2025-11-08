"use client"

import { useState } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { useRouter } from "next/navigation"
import { User, Settings, LogOut, Eye, Wallet } from "lucide-react"
import { setCurrentUser } from "@/lib/auth-utils"

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    setCurrentUser(null)
    router.push("/login")
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 border-4 border-black rounded-full overflow-hidden bg-gray-100 hover:ring-4 hover:ring-[#CCFF00] transition-all"
      >
        <NextImage src="/woman-designer-avatar.png" alt="User avatar" width={48} height={48} className="w-full h-full object-cover" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20">
            <div className="p-4 border-b-4 border-black bg-[#CCFF00]">
              <p className="font-black text-lg">Sarah Chen</p>
              <p className="text-sm font-bold">@sarahdesigns</p>
            </div>
            <div className="py-2">
              <Link
                href="/sarahdesigns"
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#CCFF00] transition-colors font-bold"
                onClick={() => setIsOpen(false)}
              >
                <Eye className="w-5 h-5" />
                View Profile
              </Link>
              <Link
                href="/profile/edit"
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#CCFF00] transition-colors font-bold"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-5 h-5" />
                Edit Profile
              </Link>
              <Link
                href="/settings/payments"
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#0000FF] hover:text-white transition-colors font-bold"
                onClick={() => setIsOpen(false)}
              >
                <Wallet className="w-5 h-5" />
                Payment Settings
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#CCFF00] transition-colors font-bold"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FF6B35] hover:text-white transition-colors font-bold text-left border-t-4 border-black"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
