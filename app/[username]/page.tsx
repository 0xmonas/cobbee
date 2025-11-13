import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CoffeeSupport } from "@/components/coffee-support"
import { RecentSupporters } from "@/components/recent-supporters"
import { Coffee } from "lucide-react"
import Link from "next/link"
import NextImage from "next/image"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { SimpleFooter } from "@/components/simple-footer"
import { Logo } from "@/components/logo"
import { TwitterIcon, InstagramIcon, GitHubIcon, TikTokIcon, OpenSeaIcon } from "@/components/icons/social-icons"
import { CopyWalletButton } from "@/components/copy-wallet-button"
import { SupporterWalletProvider } from "@/context/supporter-wallet-context"

interface CreatorProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function CreatorProfilePage({ params }: CreatorProfilePageProps) {
  const { username } = await params
  const supabase = await createClient()

  // Get authenticated user (if any)
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // Fetch creator by username using VIEW (prevents email leak)
  const { data: creator, error: creatorError } = await supabase
    .from('public_creator_profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (creatorError || !creator) {
    notFound()
  }

  // Check if viewing own profile (before fetching supports)
  const isOwnProfile = authUser?.id === creator.id

  // Fetch supports based on who is viewing
  // - If viewing own profile: fetch all supports (including hidden, but not private)
  // - If viewing others' profile: fetch only public, non-hidden supports
  let supportsQuery = supabase
    .from('supports')
    .select('*')
    .eq('creator_id', creator.id)
    .eq('status', 'confirmed')  // Only confirmed supports
    .eq('is_message_private', false)  // Never show private messages

  // Only filter hidden messages if NOT viewing own profile
  if (!isOwnProfile) {
    supportsQuery = supportsQuery.eq('is_hidden_by_creator', false)
  }

  const { data: supports } = await supportsQuery
    .order('created_at', { ascending: false })
    .limit(50)

  // Get current user's profile if authenticated
  let currentUserProfile: { username: string } | null = null
  if (authUser) {
    const { data: profile } = await supabase
      .from('users')
      .select('username')
      .eq('id', authUser.id)
      .single()

    currentUserProfile = profile
  }

  // Calculate total unique supporters (not total supports)
  const uniqueSupporters = new Set(supports?.map(s => s.supporter_wallet_address) || [])
  const totalSupports = uniqueSupporters.size

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
                {currentUserProfile && (
                  <Link href="/dashboard" className="text-lg font-bold hover:underline">
                    Dashboard
                  </Link>
                )}
                {!currentUserProfile && (
                  <Link href="/login" className="text-lg font-bold hover:underline">
                    Log in
                  </Link>
                )}
                {currentUserProfile ? (
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
                {currentUserProfile && (
                  <Link href="/dashboard" className="text-sm font-bold hover:underline">
                    Dashboard
                  </Link>
                )}
                {!currentUserProfile && (
                  <Link href="/login" className="text-sm font-bold hover:underline">
                    Log in
                  </Link>
                )}
                {currentUserProfile ? (
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
      <div className="w-full h-64 border-b-4 border-black overflow-hidden bg-gray-100">
        {creator.cover_image_url ? (
          <NextImage
            src={creator.cover_image_url}
            alt="Cover"
            width={1500}
            height={500}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#0000FF] to-[#CCFF00]" />
        )}
      </div>

      {/* Profile Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Column - Profile Info */}
            <div className="md:w-1/3">
              <div className="sticky top-8">
                <Avatar className="w-32 h-32 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <AvatarImage src={creator.avatar_url || undefined} alt={creator.display_name} />
                  <AvatarFallback className="text-3xl font-black bg-[#CCFF00]">
                    {creator.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <h1 className="text-4xl font-black mt-6 mb-2">{creator.display_name}</h1>
                <p className="text-xl font-bold text-gray-600 mb-4">@{creator.username}</p>

                {creator.bio && (
                  <p className="text-lg font-bold leading-relaxed mb-4">{creator.bio}</p>
                )}

                {/* Social Media Links */}
                {(creator.twitter_handle ||
                  creator.instagram_handle ||
                  creator.github_handle ||
                  creator.tiktok_handle ||
                  creator.opensea_handle) && (
                  <div className="flex items-center gap-3 mb-6 flex-wrap">
                    {creator.twitter_handle && (
                      <a
                        href={`https://twitter.com/${creator.twitter_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-[#0000FF] transition-colors"
                        title="Twitter"
                      >
                        <TwitterIcon className="w-6 h-6" />
                      </a>
                    )}
                    {creator.instagram_handle && (
                      <a
                        href={`https://instagram.com/${creator.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-[#0000FF] transition-colors"
                        title="Instagram"
                      >
                        <InstagramIcon className="w-6 h-6" />
                      </a>
                    )}
                    {creator.github_handle && (
                      <a
                        href={`https://github.com/${creator.github_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-[#0000FF] transition-colors"
                        title="GitHub"
                      >
                        <GitHubIcon className="w-6 h-6" />
                      </a>
                    )}
                    {creator.tiktok_handle && (
                      <a
                        href={`https://tiktok.com/@${creator.tiktok_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black hover:text-[#0000FF] transition-colors"
                        title="TikTok"
                      >
                        <TikTokIcon className="w-6 h-6" />
                      </a>
                    )}
                    {creator.opensea_handle && (
                      <a
                        href={`https://opensea.io/${creator.opensea_handle}`}
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
                      <p className="text-3xl font-black">{totalSupports}</p>
                    </div>
                  </div>

                  {creator.wallet_address && (
                    <div className="border-t-2 border-white pt-4">
                      <p className="text-xs font-bold text-white mb-2">WALLET ADDRESS</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-mono font-bold text-white break-all flex-1">
                          {creator.wallet_address.slice(0, 6)}...{creator.wallet_address.slice(-4)}
                        </p>
                        <CopyWalletButton walletAddress={creator.wallet_address} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Support Form & Recent Supporters */}
            <div className="md:w-2/3 space-y-8">
              <SupporterWalletProvider>
                <CoffeeSupport creator={creator} />
              </SupporterWalletProvider>
              <RecentSupporters
                supports={supports || []}
                isOwnProfile={isOwnProfile}
                creatorUsername={creator.username}
                creatorAvatar={creator.avatar_url}
                creatorDisplayName={creator.display_name}
              />
            </div>
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  )
}
