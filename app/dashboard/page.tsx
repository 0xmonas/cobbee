"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mockCreators, mockSupports } from "@/lib/mock-data"
import { Coffee, TrendingUp, Users, ExternalLink, Settings, Copy, Check } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { NotificationsMenu } from "@/components/notifications-menu"
import { SimpleFooter } from "@/components/simple-footer"
import { Logo } from "@/components/logo"

export default function DashboardPage() {
  const [copiedLink, setCopiedLink] = useState(false)
  // For demo purposes, we'll use the first creator as the logged-in user
  const currentCreator = mockCreators[0]
  const supports = mockSupports[currentCreator.id] || []

  const totalEarnings = supports.reduce((sum, support) => sum + support.amount, 0)
  const totalCoffees = supports.reduce((sum, support) => sum + support.coffeeCount, 0)
  const recentSupports = supports.slice(0, 5)

  const profileUrl = `https://cobbee.fun/${currentCreator.username}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleShareOnX = () => {
    const text = `Support me on Cobbee! ☕ @cobbeefun`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
            <span className="text-2xl font-black hidden sm:inline">Cobbee</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/discover" className="text-lg font-bold hover:underline">
              Discover
            </Link>
            <Button
              asChild
              variant="outline"
              className="font-bold text-lg border-4 border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-transparent"
            >
              <Link href={`/${currentCreator.username}`}>
                View Profile
                <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <NotificationsMenu />
            <UserMenu />
          </div>
          {/* Mobile */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/discover" className="text-sm font-bold hover:underline">
              Discover
            </Link>
            <NotificationsMenu />
            <UserMenu />
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-5xl font-black mb-4">Welcome back, {currentCreator.displayName.split(" ")[0]}!</h1>
            <p className="text-2xl font-bold text-gray-600">Here's how your page is performing</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {/* Total Earnings */}
            <div className="bg-[#0000FF] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center border-4 border-black">
                  <span className="text-2xl font-black">$</span>
                </div>
              </div>
              <p className="text-sm font-bold text-white mb-1">Total Earnings</p>
              <p className="text-4xl font-black text-white">${totalEarnings}</p>
            </div>

            {/* Total Coffees */}
            <div className="bg-[#CCFF00] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-black w-12 h-12 rounded-full flex items-center justify-center border-4 border-black">
                  <Coffee className="w-6 h-6 text-[#CCFF00]" />
                </div>
              </div>
              <p className="text-sm font-bold text-black mb-1">Total Coffees</p>
              <p className="text-4xl font-black text-black">{totalCoffees}</p>
            </div>

            {/* Total Supporters */}
            <div className="bg-[#FF6B35] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center border-4 border-black">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-white mb-1">Total Supporters</p>
              <p className="text-4xl font-black text-white">{currentCreator.totalSupports}</p>
            </div>

            {/* Average Support */}
            <div className="bg-chart-6 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center border-4 border-black">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-white mb-1">Avg. Support</p>
              <p className="text-4xl font-black text-white">
                ${supports.length > 0 ? (totalEarnings / supports.length).toFixed(0) : 0}
              </p>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Supporters */}
            <div className="lg:col-span-2">
              <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-black">Recent Supporters</h2>
                  <Button
                    asChild
                    variant="outline"
                    className="font-bold border-4 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-transparent"
                  >
                    <Link href="/settings/payments">View All</Link>
                  </Button>
                </div>

                {recentSupports.length === 0 ? (
                  <div className="text-center py-12">
                    <Coffee className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl font-bold text-gray-600">No supporters yet</p>
                    <p className="text-lg font-bold text-gray-500 mt-2">Share your page to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSupports.map((support) => (
                      <div
                        key={support.id}
                        className="border-4 border-black rounded-xl p-5 bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 border-4 border-black">
                            <AvatarImage
                              src={support.supporterAvatar || "/placeholder.svg"}
                              alt={support.supporterName}
                            />
                            <AvatarFallback className="font-black bg-[#0000FF] text-white">
                              {support.supporterName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-lg font-black">{support.supporterName}</p>
                            <p className="text-sm font-bold text-gray-600">{support.timestamp}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">${support.amount}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Coffee className="w-4 h-4" />
                            <span className="text-sm font-black">×{support.coffeeCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-[#CCFF00] border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black mb-4">Your Profile</h3>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16 border-4 border-black">
                    <AvatarImage src={currentCreator.avatar || "/placeholder.svg"} alt={currentCreator.displayName} />
                    <AvatarFallback className="font-black bg-white">
                      {currentCreator.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-black">{currentCreator.displayName}</p>
                    <p className="text-sm font-bold">@{currentCreator.username}</p>
                  </div>
                </div>
                <Button
                  asChild
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-6 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <Link href="/profile/edit">
                    <Settings className="w-5 h-5 mr-2" />
                    Edit Profile
                  </Link>
                </Button>
              </div>

              {/* Share Card */}
              <div className="bg-[#0000FF] border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black text-white mb-4">Share Your Page</h3>
                <p className="text-lg font-bold text-white mb-4 leading-relaxed">
                  Get more supporters by sharing your page on social media
                </p>
                <div className="bg-white border-4 border-black rounded-xl p-3 mb-4">
                  <p className="text-sm font-bold truncate">cobbee.fun/{currentCreator.username}</p>
                </div>

                {/* Copy Link Button */}
                <Button
                  onClick={handleCopyLink}
                  className="w-full bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold text-lg py-6 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all mb-3"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>

                {/* Share on X Button */}
                <Button
                  onClick={handleShareOnX}
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold text-lg py-6 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </Button>
              </div>

              {/* Tips Card */}
              <div className="bg-[#FF6B35] border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-2xl font-black text-white mb-4">Pro Tips</h3>
                <ul className="space-y-3 text-white">
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">💡</span>
                    <p className="text-sm font-bold leading-relaxed">
                      Update your profile regularly with fresh content
                    </p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">🎯</span>
                    <p className="text-sm font-bold leading-relaxed">Engage with your supporters and thank them</p>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-2xl">📱</span>
                    <p className="text-sm font-bold leading-relaxed">Share your page link in your social bios</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  )
}
