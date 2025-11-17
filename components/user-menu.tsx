"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { User, Settings, LogOut, Eye, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useDisconnect } from '@reown/appkit/react'
import { getInitials } from "@/lib/avatar-utils"

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { disconnect } = useDisconnect()

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        setUser(data)
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()

      // 1. Sign out from Supabase
      await supabase.auth.signOut()

      // 2. Disconnect wallet
      await disconnect()

      // 3. Redirect to landing page
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      router.push("/")
      router.refresh()
    }
  }

  if (loading || !user) {
    return (
      <div className="w-12 h-12 border-4 border-black rounded-full overflow-hidden bg-gray-200 animate-pulse" />
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 border-4 border-black rounded-full overflow-hidden bg-gray-100 hover:ring-4 hover:ring-[#CCFF00] transition-all"
      >
        <Avatar className="w-full h-full">
          <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
          <AvatarFallback className="text-xl font-black bg-white">
            {getInitials(user.display_name || 'User')}
          </AvatarFallback>
        </Avatar>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-20">
            <div className="p-4 border-b-4 border-black bg-[#CCFF00]">
              <p className="font-black text-lg">{user.display_name}</p>
              <p className="text-sm font-bold">@{user.username}</p>
            </div>
            <div className="py-2">
              <Link
                href={`/${user.username}`}
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
