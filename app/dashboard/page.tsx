import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Coffee, TrendingUp, Users, ExternalLink, Settings } from "lucide-react"
import { UserMenu } from "@/components/user-menu"
import { NotificationsMenu } from "@/components/notifications-menu"
import { SimpleFooter } from "@/components/simple-footer"
import { Logo } from "@/components/logo"
import { DashboardActions } from "@/components/dashboard-actions"
import { createClient } from "@/lib/supabase/server"
import { getInitials } from "@/lib/avatar-utils"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  // Fetch current user's profile
  const { data: currentCreator, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (profileError || !currentCreator) {
    // User authenticated but no profile - redirect to complete signup
    redirect('/signup')
  }

  // Fetch user's supports (all - including private/hidden for owner)
  const { data: supports } = await supabase
    .from('supports')
    .select('*')
    .eq('creator_id', currentCreator.id)
    .order('created_at', { ascending: false })

  // Calculate statistics
  const totalEarnings = supports?.reduce((sum, support) => sum + Number(support.total_amount), 0) || 0
  const totalCoffees = supports?.reduce((sum, support) => sum + support.coffee_count, 0) || 0
  const totalSupporters = supports?.length || 0
  const avgSupport = totalSupporters > 0 ? totalEarnings / totalSupporters : 0

  // Get recent supports (last 5)
  const recentSupports = supports?.slice(0, 5) || []

  const profileUrl = `https://cobbee.fun/${currentCreator.username}`

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
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
            <h1 className="text-5xl font-black mb-4">
              Welcome back, {currentCreator.display_name.split(" ")[0]}!
            </h1>
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
              <p className="text-4xl font-black text-white">${totalEarnings.toFixed(2)}</p>
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
              <p className="text-4xl font-black text-white">{totalSupporters}</p>
            </div>

            {/* Average Support */}
            <div className="bg-chart-6 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center border-4 border-black">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-white mb-1">Avg. Support</p>
              <p className="text-4xl font-black text-white">${avgSupport.toFixed(0)}</p>
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
                              src={support.supporter_avatar_url && !support.supporter_avatar_url.includes('placeholder') ? support.supporter_avatar_url : undefined}
                              alt={support.supporter_name}
                            />
                            <AvatarFallback className="font-black bg-[#0000FF] text-white">
                              {getInitials(support.supporter_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-lg font-black">{support.supporter_name}</p>
                            <p className="text-sm font-bold text-gray-600">
                              {formatTimeAgo(support.created_at || '')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black">${Number(support.total_amount).toFixed(2)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Coffee className="w-4 h-4" />
                            <span className="text-sm font-black">×{support.coffee_count}</span>
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
                    <AvatarImage src={currentCreator.avatar_url && !currentCreator.avatar_url.includes('placeholder') ? currentCreator.avatar_url : undefined} alt={currentCreator.display_name} />
                    <AvatarFallback className="font-black bg-white">
                      {getInitials(currentCreator.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xl font-black">{currentCreator.display_name}</p>
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

              {/* Share Actions - Client Component */}
              <DashboardActions profileUrl={profileUrl} username={currentCreator.username} />

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
