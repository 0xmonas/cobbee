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
import { TwitterIcon, InstagramIcon, GitHubIcon, TikTokIcon, OpenSeaIcon } from "@/components/icons/social-icons"

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
                          <TwitterIcon className="w-6 h-6" />
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
                          <InstagramIcon className="w-6 h-6" />
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
                          <GitHubIcon className="w-6 h-6" />
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
                          <TikTokIcon className="w-6 h-6" />
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
                          <OpenSeaIcon className="w-6 h-6" />
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
