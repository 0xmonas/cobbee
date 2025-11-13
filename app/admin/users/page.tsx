import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import Link from 'next/link'
import {
  ArrowLeft,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Coffee,
  Mail,
  Wallet,
  Shield,
} from 'lucide-react'

export const metadata = {
  title: 'Users Management - Admin - Cobbee',
  description: 'Manage creator accounts',
}

interface Creator {
  id: string
  username: string
  display_name: string
  email: string | null
  wallet_address: string | null
  coffee_price: number
  is_active: boolean
  created_at: string
  total_supports: number
  total_supporters: number
  total_earnings: number
  supports_last_30_days: number
  earnings_last_30_days: number
  last_support_at: string | null
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const searchQuery = params.search || ''

  const supabase = await createClient()

  // Check authentication
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/users')
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

  // Use admin client to fetch users
  const adminSupabase = createAdminClient()

  // Fetch creators
  let creators: Creator[] = []
  if (searchQuery) {
    // Search users
    const { data, error } = await adminSupabase.rpc('admin_search_users', {
      p_search_term: searchQuery,
      p_limit: 50,
    })

    if (!error && data) {
      creators = data
    }
  } else {
    // Get all creators (sorted by earnings)
    const { data, error } = await adminSupabase
      .from('admin_top_creators')
      .select('*')
      .limit(50)

    if (!error && data) {
      creators = data
    }
  }

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
                <Users className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-black text-white">Users Management</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        {/* Search Bar */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <form method="GET" className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by username, email, or wallet address..."
                className="w-full pl-12 pr-4 py-4 text-lg font-bold border-4 border-black rounded-xl focus:ring-4 focus:ring-[#CCFF00]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-black text-lg px-8 py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Search
            </button>
            {searchQuery && (
              <Link
                href="/admin/users"
                className="bg-gray-200 hover:bg-gray-300 text-black font-bold text-lg px-6 py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-[#0000FF]" />
              <span className="font-bold text-gray-600">Total Users</span>
            </div>
            <div className="text-3xl font-black">{creators.length}</div>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-600">Active Users</span>
            </div>
            <div className="text-3xl font-black">
              {creators.filter((c) => c.is_active).length}
            </div>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <span className="font-bold text-gray-600">Inactive Users</span>
            </div>
            <div className="text-3xl font-black">
              {creators.filter((c) => !c.is_active).length}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#CCFF00] border-b-4 border-black p-4">
            <h2 className="text-2xl font-black">
              {searchQuery ? `Search Results: "${searchQuery}"` : 'All Creators'}
            </h2>
          </div>
          <div className="p-6">
            {creators.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl font-bold text-gray-500">No users found</p>
                {searchQuery && (
                  <p className="text-sm text-gray-400 font-bold mt-2">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-4 border-black">
                      <th className="text-left p-4 font-black">User</th>
                      <th className="text-left p-4 font-black">Contact</th>
                      <th className="text-right p-4 font-black">Stats</th>
                      <th className="text-right p-4 font-black">Earnings</th>
                      <th className="text-center p-4 font-black">Status</th>
                      <th className="text-center p-4 font-black">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creators.map((creator) => (
                      <tr
                        key={creator.id}
                        className="border-b-2 border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {/* User Info */}
                        <td className="p-4">
                          <div>
                            <div className="font-black text-lg">{creator.display_name}</div>
                            <div className="text-sm font-bold text-gray-600">
                              @{creator.username}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {new Date(creator.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-4">
                          <div className="space-y-1">
                            {creator.email && (
                              <div className="flex items-center gap-2 text-sm font-bold">
                                <Mail className="w-4 h-4 text-gray-500" />
                                <span className="truncate max-w-[200px]">{creator.email}</span>
                              </div>
                            )}
                            {creator.wallet_address && (
                              <div className="flex items-center gap-2 text-sm font-mono font-bold">
                                <Wallet className="w-4 h-4 text-gray-500" />
                                <span>
                                  {creator.wallet_address.slice(0, 6)}...
                                  {creator.wallet_address.slice(-4)}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Stats */}
                        <td className="p-4 text-right">
                          <div className="space-y-1">
                            <div className="flex items-center justify-end gap-2 text-sm font-bold">
                              <Coffee className="w-4 h-4" />
                              {creator.total_supports} supports
                            </div>
                            <div className="flex items-center justify-end gap-2 text-sm font-bold text-gray-600">
                              <Users className="w-4 h-4" />
                              {creator.total_supporters} supporters
                            </div>
                          </div>
                        </td>

                        {/* Earnings */}
                        <td className="p-4 text-right">
                          <div className="space-y-1">
                            <div className="flex items-center justify-end gap-2 font-black text-lg">
                              <DollarSign className="w-5 h-5" />
                              {creator.total_earnings.toFixed(2)}
                            </div>
                            <div className="text-xs font-bold text-gray-600">
                              ${creator.earnings_last_30_days.toFixed(2)} (30d)
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          {creator.is_active ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 border-2 border-green-600 text-xs font-black">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 border-2 border-red-600 text-xs font-black">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          <Link
                            href={`/${creator.username}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0000FF] hover:bg-[#0000DD] text-white font-bold text-sm rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                          >
                            View Profile
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
