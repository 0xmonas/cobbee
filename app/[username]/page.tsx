"use client"

import { notFound } from "next/navigation"
import { mockCreators, mockSupports } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CoffeeSupport } from "@/components/coffee-support"
import { RecentSupporters } from "@/components/recent-supporters"
import { Coffee, Copy, Check } from "lucide-react"
import Link from "next/link"
import { use, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { getCurrentUser } from "@/lib/auth-utils"
import { SimpleFooter } from "@/components/simple-footer"
import { Logo } from "@/components/logo"

export default function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const creator = mockCreators.find((c) => c.username === username)
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null)

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  if (!creator) {
    notFound()
  }

  const supports = mockSupports[creator.id] || []
  const isOwnProfile = currentUser?.username === creator.username
  const [copiedWallet, setCopiedWallet] = useState(false)

  const handleCopyWallet = () => {
    if (creator.walletAddress) {
      navigator.clipboard.writeText(creator.walletAddress)
      setCopiedWallet(true)
      setTimeout(() => setCopiedWallet(false), 2000)
    }
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
            {isOwnProfile ? (
              <>
                <Link href="/dashboard" className="text-lg font-bold hover:underline">
                  Dashboard
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <Link href="/discover" className="text-sm font-bold hover:underline">
              Discover
            </Link>
            {isOwnProfile ? (
              <>
                <Link href="/dashboard" className="text-sm font-bold hover:underline">
                  Dashboard
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Cover Image */}
      <div className="w-full h-64 border-b-4 border-black overflow-hidden">
        <img src={creator.coverImage || "/placeholder.svg"} alt="Cover" className="w-full h-full object-cover" />
      </div>

      {/* Profile Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Column - Profile Info */}
            <div className="md:w-1/3">
              <div className="sticky top-8">
                <Avatar className="w-32 h-32 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <AvatarImage src={creator.avatar || "/placeholder.svg"} alt={creator.displayName} />
                  <AvatarFallback className="text-3xl font-black bg-[#CCFF00]">
                    {creator.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-4xl font-black mt-6 mb-2">{creator.displayName}</h1>
                <p className="text-xl font-bold text-gray-600 mb-4">@{creator.username}</p>

                <p className="text-lg font-bold leading-relaxed mb-4">{creator.bio}</p>

                {/* Social Media Links */}
                {creator.socialMedia &&
                  (creator.socialMedia.twitter ||
                    creator.socialMedia.instagram ||
                    creator.socialMedia.github ||
                    creator.socialMedia.tiktok ||
                    creator.socialMedia.opensea) && (
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                      {creator.socialMedia.twitter && (
                        <a
                          href={`https://twitter.com/${creator.socialMedia.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-[#0000FF] transition-colors"
                          title="Twitter"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d="M214.75,211.71l-62.6-98.38,61.77-67.95a8,8,0,0,0-11.84-10.76L143.24,99.34,102.75,35.71A8,8,0,0,0,96,32H48a8,8,0,0,0-6.75,12.3l62.6,98.37-61.77,68a8,8,0,1,0,11.84,10.76l58.84-64.72,40.49,63.63A8,8,0,0,0,160,224h48a8,8,0,0,0,6.75-12.29ZM164.39,208,62.57,48h29L193.43,208Z"></path>
                          </svg>
                        </a>
                      )}
                      {creator.socialMedia.instagram && (
                        <a
                          href={`https://instagram.com/${creator.socialMedia.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-[#0000FF] transition-colors"
                          title="Instagram"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160ZM176,24H80A56.06,56.06,0,0,0,24,80v96a56.06,56.06,0,0,0,56,56h96a56.06,56.06,0,0,0,56-56V80A56.06,56.06,0,0,0,176,24Zm40,152a40,40,0,0,1-40,40H80a40,40,0,0,1-40-40V80A40,40,0,0,1,80,40h96a40,40,0,0,1,40,40ZM192,76a12,12,0,1,1-12-12A12,12,0,0,1,192,76Z"></path>
                          </svg>
                        </a>
                      )}
                      {creator.socialMedia.github && (
                        <a
                          href={`https://github.com/${creator.socialMedia.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-[#0000FF] transition-colors"
                          title="GitHub"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d="M208.31,75.68A59.78,59.78,0,0,0,202.93,28,8,8,0,0,0,196,24a59.75,59.75,0,0,0-48,24H124A59.75,59.75,0,0,0,76,24a8,8,0,0,0-6.93,4,59.78,59.78,0,0,0-5.38,47.68A58.14,58.14,0,0,0,56,104v8a56.06,56.06,0,0,0,48.44,55.47A39.8,39.8,0,0,0,96,192v8H72a24,24,0,0,1-24-24A40,40,0,0,0,8,136a8,8,0,0,0,0,16,24,24,0,0,1,24,24,40,40,0,0,0,40,40H96v16a8,8,0,0,0,16,0V192a24,24,0,0,1,48,0v40a8,8,0,0,0,16,0V192a39.8,39.8,0,0,0-8.44-24.53A56.06,56.06,0,0,0,216,112v-8A58.14,58.14,0,0,0,208.31,75.68ZM200,112a40,40,0,0,1-40,40H112a40,40,0,0,1-40-40v-8a41.74,41.74,0,0,1,6.9-22.48,8,8,0,0,0,1.1-7.69,43.81,43.81,0,0,1,.79-33.58,43.88,43.88,0,0,1,32.32,20.06A8,8,0,0,0,119.82,64h32.35a8,8,0,0,0,6.74-3.69,43.87,43.87,0,0,1,32.32-20.06A43.81,43.81,0,0,1,192,73.83a8.09,8.09,0,0,0,1,7.65A41.72,41.72,0,0,1,200,104Z"></path>
                          </svg>
                        </a>
                      )}
                      {creator.socialMedia.tiktok && (
                        <a
                          href={`https://tiktok.com/@${creator.socialMedia.tiktok}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-[#0000FF] transition-colors"
                          title="TikTok"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d="M224,72a48.05,48.05,0,0,1-48-48,8,8,0,0,0-8-8H128a8,8,0,0,0-8,8V156a20,20,0,1,1-28.57-18.08A8,8,0,0,0,96,130.69V88a8,8,0,0,0-9.4-7.88C50.91,86.48,24,119.1,24,156a76,76,0,1,0,152,0V116.29A103.25,103.25,0,0,0,224,128a8,8,0,0,0,8-8V80A8,8,0,0,0,224,72Zm-8,39.64a87.19,87.19,0,0,1-43.33-16.15A8,8,0,0,0,160,102v54a60,60,0,1,1-84.62-54.85v27.58A36,36,0,1,0,136,156V32h24.5A64.14,64.14,0,0,0,216,87.5Z"></path>
                          </svg>
                        </a>
                      )}
                      {creator.socialMedia.opensea && (
                        <a
                          href={`https://opensea.io/${creator.socialMedia.opensea}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black hover:text-[#0000FF] transition-colors"
                          title="OpenSea"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 256 256"
                          >
                            <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM204.8,78.4,164,145.6a8.1,8.1,0,0,1-11.73,1.87L120,124.5,69.87,177.6a8,8,0,0,1-11.2.93A8.37,8.37,0,0,1,56,172a8,8,0,0,1,1.6-6.4L108,113.5l-32-22.87a8.1,8.1,0,0,1-1.87-11.73A8,8,0,0,1,85.87,76.13L128,104l42.13-27.87a8.1,8.1,0,0,1,11.73,1.87A8,8,0,0,1,204.8,78.4Z"></path>
                          </svg>
                        </a>
                      )}
                    </div>
                  )}

                <div className="bg-[#0000FF] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 text-white mb-6">
                    <Coffee className="w-8 h-8" />
                    <div>
                      <p className="text-sm font-bold">Total Supporters</p>
                      <p className="text-3xl font-black">{creator.totalSupports}</p>
                    </div>
                  </div>

                  {creator.walletAddress && (
                    <div className="border-t-2 border-white pt-4">
                      <p className="text-xs font-bold text-white mb-2">WALLET ADDRESS</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono font-bold text-white break-all flex-1">
                          {creator.walletAddress.slice(0, 6)}...{creator.walletAddress.slice(-4)}
                        </p>
                        <button
                          onClick={handleCopyWallet}
                          className="bg-[#CCFF00] hover:bg-[#B8E600] text-black font-bold p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex-shrink-0"
                          title="Copy wallet address"
                        >
                          {copiedWallet ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Support Form & Recent Supporters */}
            <div className="md:w-2/3 space-y-8">
              <CoffeeSupport creator={creator} />
              <RecentSupporters
                supports={supports}
                isOwnProfile={isOwnProfile}
                creatorUsername={creator.username}
                creatorAvatar={creator.avatar}
                creatorDisplayName={creator.displayName}
              />
            </div>
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  )
}
