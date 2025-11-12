"use client"

import { useState } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Coffee, Users } from "lucide-react"
import type { Database } from "@/lib/types/database.types"

type User = Database['public']['Tables']['users']['Row'] & {
  supporter_count?: number
}

interface DiscoverSearchProps {
  creators: User[]
}

export function DiscoverSearch({ creators }: DiscoverSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCreators = creators.filter(
    (creator) =>
      creator.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (creator.bio && creator.bio.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  return (
    <>
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
                          {creator.cover_image_url ? (
                            <NextImage
                              src={creator.cover_image_url}
                              alt={creator.display_name}
                              width={600}
                              height={300}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full bg-linear-to-r from-[#0000FF] to-[#CCFF00]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="w-16 h-16 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                              <AvatarImage src={creator.avatar_url || undefined} alt={creator.display_name} />
                              <AvatarFallback className="text-xl font-black bg-white">
                                {creator.display_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className={`text-2xl font-black ${textColors[colorIndex]} mb-1`}>
                                {creator.display_name}
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
                                  {creator.supporter_count || 0}
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
                                <p className={`text-lg font-black ${textColors[colorIndex]}`}>${Number(creator.coffee_price).toFixed(2)}</p>
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
    </>
  )
}
