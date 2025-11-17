import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Coffee,
  Calendar,
  AlertTriangle,
} from 'lucide-react'

export const metadata = {
  title: 'Analytics - Admin - Cobbee',
  description: 'Platform analytics and metrics',
}

interface DailyAnalytics {
  date: string
  new_creators: number
  new_supports: number
  total_volume: number
  unique_supporters: number
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const params = await searchParams
  const days = parseInt(params.days || '30')

  const supabase = await createClient()

  // Check authentication
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/analytics')
  }

  // Get user's wallet address
  const { data: userProfile } = await supabase
    .from('users')
    .select('wallet_address')
    .eq('id', authUser.id)
    .single()

  const walletAddress = userProfile?.wallet_address

  // Verify admin access
  if (!isAdminWallet(walletAddress)) {
    redirect('/dashboard')
  }

  // Use admin client to fetch analytics
  const adminSupabase = createAdminClient()

  // Fetch analytics data
  const { data: analyticsData, error } = await adminSupabase.rpc(
    'admin_get_analytics',
    { p_days: days }
  )

  if (error) {
    console.error('Analytics RPC error:', error)
  }

  const analytics: DailyAnalytics[] = analyticsData || []

  // Debug logging
  console.log('Analytics query result:', {
    days,
    rowCount: analytics.length,
    hasError: !!error,
    error: error?.message,
    firstRow: analytics[0],
  })

  // Calculate totals
  const totalNewCreators = analytics.reduce((sum, day) => sum + day.new_creators, 0)
  const totalNewSupports = analytics.reduce((sum, day) => sum + day.new_supports, 0)
  const totalVolume = analytics.reduce((sum, day) => sum + parseFloat(day.total_volume.toString()), 0)
  const avgDailyVolume = analytics.length > 0 ? totalVolume / analytics.length : 0

  // Get platform stats
  const { data: platformStats } = await adminSupabase
    .from('admin_platform_stats')
    .select('*')
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-4 border-black bg-[#0000FF]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-white hover:text-[#CCFF00] transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
                <span className="font-bold">Back</span>
              </Link>
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-black text-white">Analytics</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        {/* Time Range Selector */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-6 h-6" />
            <span className="font-black text-lg">Time Range:</span>
            <div className="flex gap-2">
              {[7, 14, 30, 60, 90].map((d) => (
                <Link
                  key={d}
                  href={`/admin/analytics?days=${d}`}
                  className={`px-4 py-2 rounded-lg border-4 border-black font-bold transition-all ${
                    days === d
                      ? 'bg-[#0000FF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {d} days
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-[#0000FF]" />
              <span className="font-bold text-gray-600">New Creators</span>
            </div>
            <div className="text-3xl font-black">{totalNewCreators}</div>
            <div className="text-xs font-bold text-gray-500 mt-1">Last {days} days</div>
          </div>

          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <Coffee className="w-6 h-6 text-orange-600" />
              <span className="font-bold text-gray-600">New Supports</span>
            </div>
            <div className="text-3xl font-black">{totalNewSupports}</div>
            <div className="text-xs font-bold text-gray-500 mt-1">Last {days} days</div>
          </div>

          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-600">Total Volume</span>
            </div>
            <div className="text-3xl font-black">${totalVolume.toFixed(2)}</div>
            <div className="text-xs font-bold text-gray-500 mt-1">Last {days} days</div>
          </div>

          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-gray-600">Avg Daily</span>
            </div>
            <div className="text-3xl font-black">${avgDailyVolume.toFixed(2)}</div>
            <div className="text-xs font-bold text-gray-500 mt-1">Per day average</div>
          </div>
        </div>

        {/* Error Display (Debug) */}
        {error && (
          <div className="border-4 border-black bg-red-50 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
              <div>
                <h3 className="font-black text-lg mb-2 text-red-600">Analytics Error</h3>
                <p className="font-bold text-sm text-gray-700">{error.message}</p>
                <pre className="mt-2 text-xs bg-white border-2 border-black rounded p-2 overflow-auto">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Daily Breakdown */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#CCFF00] border-b-4 border-black p-4">
            <h2 className="text-2xl font-black">Daily Breakdown</h2>
          </div>
          <div className="p-6">
            {analytics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-black">
                      <th className="text-left p-4 font-black">Date</th>
                      <th className="text-right p-4 font-black">New Creators</th>
                      <th className="text-right p-4 font-black">New Supports</th>
                      <th className="text-right p-4 font-black">Volume</th>
                      <th className="text-right p-4 font-black">Unique Supporters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((day, idx) => (
                      <tr
                        key={idx}
                        className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 font-bold">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {day.new_creators > 0 ? (
                            <span className="text-green-600">+{day.new_creators}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {day.new_supports > 0 ? (
                            <span className="text-blue-600">{day.new_supports}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-black">
                          {parseFloat(day.total_volume.toString()) > 0 ? (
                            <span>${parseFloat(day.total_volume.toString()).toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-400">$0.00</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-bold">
                          {day.unique_supporters > 0 ? (
                            <span>{day.unique_supporters}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl font-bold text-gray-500">No analytics data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Overview */}
        {platformStats && (
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#0000FF] border-b-4 border-black p-4">
              <h2 className="text-2xl font-black text-white">Platform Overview (All Time)</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border-2 border-black rounded-xl p-4 bg-gray-50">
                  <div className="text-sm font-bold text-gray-600 mb-1">Total Creators</div>
                  <div className="text-3xl font-black">
                    {platformStats.total_active_creators}
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-1">
                    ({platformStats.total_inactive_creators} inactive)
                  </div>
                </div>

                <div className="border-2 border-black rounded-xl p-4 bg-gray-50">
                  <div className="text-sm font-bold text-gray-600 mb-1">Total Supports</div>
                  <div className="text-3xl font-black">
                    {platformStats.total_confirmed_supports}
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-1">
                    ({platformStats.total_pending_supports} pending)
                  </div>
                </div>

                <div className="border-2 border-black rounded-xl p-4 bg-gray-50">
                  <div className="text-sm font-bold text-gray-600 mb-1">All-Time Volume</div>
                  <div className="text-3xl font-black">
                    ${parseFloat((platformStats.total_platform_volume_usd ?? 0).toString()).toFixed(2)}
                  </div>
                  <div className="text-xs font-bold text-gray-500 mt-1">
                    {platformStats.total_unique_supporters} unique supporters
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="border-4 border-black bg-blue-50 p-6 rounded-2xl">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-6 h-6 text-[#0000FF] mt-1" />
            <div>
              <h3 className="font-black text-lg mb-2">Analytics Notes</h3>
              <ul className="font-bold text-sm text-gray-700 leading-relaxed space-y-1 list-disc list-inside">
                <li>All times are in UTC timezone</li>
                <li>Volume metrics are in USD</li>
                <li>Data is updated in real-time</li>
                <li>Historical data retention: Unlimited</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
