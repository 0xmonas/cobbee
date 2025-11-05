import { notFound } from "next/navigation"
import { mockCreators, mockSupports } from "@/lib/mock-data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CoffeeSupport } from "@/components/coffee-support"
import { RecentSupporters } from "@/components/recent-supporters"
import { Coffee } from "lucide-react"
import Link from "next/link"

export default function CreatorProfilePage({ params }: { params: { username: string } }) {
  const creator = mockCreators.find((c) => c.username === params.username)

  if (!creator) {
    notFound()
  }

  const supports = mockSupports[creator.id] || []

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b-4 border-black bg-white">
        <nav className="container mx-auto px-4 py-6">
          <Link href="/" className="text-3xl font-black">
            BuyCoffee
          </Link>
        </nav>
      </header>

      {/* Cover Image */}
      <div className="w-full h-64 border-b-4 border-black overflow-hidden">
        <img src={creator.coverImage || "/placeholder.svg"} alt="Cover" className="w-full h-full object-cover" />
      </div>

      {/* Profile Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
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

                <p className="text-lg font-bold leading-relaxed mb-6">{creator.bio}</p>

                <div className="bg-[#0000FF] border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-3 text-white">
                    <Coffee className="w-8 h-8" />
                    <div>
                      <p className="text-sm font-bold">Total Supporters</p>
                      <p className="text-3xl font-black">{creator.totalSupports}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Support Form & Recent Supporters */}
            <div className="md:w-2/3 space-y-8">
              <CoffeeSupport creator={creator} />
              <RecentSupporters supports={supports} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
