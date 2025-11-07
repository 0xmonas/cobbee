"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mockCreators } from "@/lib/mock-data"
import { Search, Coffee, Users } from "lucide-react"
import { getCurrentUser } from "@/lib/auth-utils"
import { UserMenu } from "@/components/user-menu"
import { SimpleFooter } from "@/components/simple-footer"

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null)

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  const filteredCreators = mockCreators.filter(
    (creator) =>
      creator.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.bio.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-white sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-[#0000FF] rounded-full p-2 border-4 border-black">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black hidden sm:inline">Cobbee</span>
          </Link>
          <div className="hidden md:flex items-center gap-4">
            {currentUser && (
              <Link href="/dashboard" className="text-lg font-bold hover:underline">
                Dashboard
              </Link>
            )}
            {!currentUser && (
              <Link href="/login" className="text-lg font-bold hover:underline">
                Log in
              </Link>
            )}
            {currentUser ? (
              <UserMenu />
            ) : (
              <Button
                asChild
                className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold text-lg px-8 py-6 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            )}
          </div>
          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            {currentUser && (
              <Link href="/dashboard" className="text-sm font-bold hover:underline">
                Dashboard
              </Link>
            )}
            {!currentUser && (
              <Link href="/login" className="text-sm font-bold hover:underline">
                Log in
              </Link>
            )}
            {currentUser ? (
              <UserMenu />
            ) : (
              <Button
                asChild
                className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold px-4 py-2 text-sm rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-[#CCFF00] border-b-4 border-black py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-black mb-6 text-balance">Discover Amazing Creators</h1>
            <p className="text-2xl font-bold mb-8 text-balance">Find and support creators doing incredible work</p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-600" />
              <Input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-8 text-xl font-bold border-4 border-black rounded-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Creators Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-7xl mx-auto">
          {filteredCreators.length === 0 ? (
            <div className="text-center py-20">
              <Coffee className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h2 className="text-3xl font-black mb-4">No creators found</h2>
              <p className="text-xl font-bold text-gray-600">Try a different search term</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl font-black">
                  {searchQuery
                    ? `Found ${filteredCreators.length} creator${filteredCreators.length !== 1 ? "s" : ""}`
                    : "All Creators"}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCreators.map((creator, index) => {
                  const bgColors = ["bg-[#0000FF]", "bg-[#CCFF00]", "bg-[#FF6B35]", "bg-black"]
                  const textColors = ["text-white", "text-black", "text-white", "text-white"]
                  const colorIndex = index % bgColors.length

                  return (
                    <Link key={creator.id} href={`/${creator.username}`} className="group">
                      <div
                        className={`${bgColors[colorIndex]} border-4 border-black rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all`}
                      >
                        {/* Cover Image */}
                        <div className="h-48 border-b-4 border-black overflow-hidden">
                          <img
                            src={creator.coverImage || "/placeholder.svg"}
                            alt={creator.displayName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="w-16 h-16 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.displayName} />
                              <AvatarFallback className="text-xl font-black bg-white">
                                {creator.displayName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className={`text-2xl font-black ${textColors[colorIndex]} mb-1`}>
                                {creator.displayName}
                              </h3>
                              <p className={`text-sm font-bold ${textColors[colorIndex]} opacity-80`}>
                                @{creator.username}
                              </p>
                            </div>
                          </div>

                          <p
                            className={`text-base font-bold ${textColors[colorIndex]} mb-6 leading-relaxed line-clamp-3`}
                          >
                            {creator.bio}
                          </p>

                          {/* Stats */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`${colorIndex === 1 ? "bg-black" : "bg-white"} w-10 h-10 rounded-full flex items-center justify-center border-4 border-black`}
                              >
                                <Users className={`w-5 h-5 ${colorIndex === 1 ? "text-white" : "text-black"}`} />
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${textColors[colorIndex]} opacity-80`}>Supporters</p>
                                <p className={`text-lg font-black ${textColors[colorIndex]}`}>
                                  {creator.totalSupports}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div
                                className={`${colorIndex === 1 ? "bg-black" : "bg-white"} w-10 h-10 rounded-full flex items-center justify-center border-4 border-black`}
                              >
                                <Coffee className={`w-5 h-5 ${colorIndex === 1 ? "text-white" : "text-black"}`} />
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${textColors[colorIndex]} opacity-80`}>Per coffee</p>
                                <p className={`text-lg font-black ${textColors[colorIndex]}`}>${creator.coffeePrice}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t-4 border-black bg-[#0000FF] py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-black text-white mb-6 text-balance">Are you a creator?</h2>
            <p className="text-2xl font-bold text-white mb-10">Start receiving support from your fans today</p>
            <Button
              asChild
              className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-black text-2xl px-12 py-8 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <Link href="/signup">Create your page</Link>
            </Button>
          </div>
        </div>
      </section>

      <SimpleFooter />
    </div>
  )
}
