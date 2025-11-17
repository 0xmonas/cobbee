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
} from 'lucide-react'
import { UserSearchForm } from '@/components/admin/user-search-form'
import { CreatorsTable } from '@/components/admin/creators-table'

export const metadata = {
  title: 'Users Management - Admin - Cobbee',
  description: 'Manage creator accounts',
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

  // Fetch creators from admin_top_creators view (includes support stats)
  let creators: Creator[] = []

  if (searchQuery) {
    // Search users using RPC function
    const { data, error } = await adminSupabase.rpc('admin_search_users', {
      p_search_term: searchQuery,
      p_limit: 50
    })

    if (!error && data) {
      creators = data.map((user: any) => ({
        ...user,
        coffee_price: user.coffee_price ?? 5.00,
        is_blocked: user.is_blocked ?? false,
        blocked_at: user.blocked_at ?? null,
        blocked_reason: user.blocked_reason ?? null,
        total_supports: 0,
        total_supporters: user.total_supporters ?? 0,
        total_earnings: user.total_earnings ?? 0,
        supports_last_30_days: 0,
        earnings_last_30_days: 0,
        last_support_at: null,
      })) as Creator[]
    }
  } else {
    // Get all creators from view (includes stats)
    const { data, error } = await adminSupabase
      .from('admin_top_creators')
      .select('*')
      .limit(50)

    if (!error && data) {
      creators = data.map((user: any) => ({
        ...user,
        coffee_price: user.coffee_price ?? 5.00,
        is_blocked: user.is_blocked ?? false,
        blocked_at: user.blocked_at ?? null,
        blocked_reason: user.blocked_reason ?? null,
        total_supports: user.total_supports ?? 0,
        total_supporters: user.total_supporters ?? 0,
        total_earnings: user.total_earnings ?? 0,
        supports_last_30_days: user.supports_last_30_days ?? 0,
        earnings_last_30_days: user.earnings_last_30_days ?? 0,
        last_support_at: user.last_support_at ?? null,
      })) as Creator[]
    }
  }

  // Calculate active/inactive based on recent activity
  // Active = received support in last 30 days
  // Inactive = no support in last 30 days OR never received support
  const activeCreators = creators.filter(c => c.supports_last_30_days > 0)
  const inactiveCreators = creators.filter(c => c.supports_last_30_days === 0)

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
            <div className="text-3xl font-black">{activeCreators.length}</div>
            <div className="text-xs font-bold text-gray-500 mt-1">
              Received support in last 30 days
            </div>
          </div>
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <span className="font-bold text-gray-600">Inactive Users</span>
            </div>
            <div className="text-3xl font-black">{inactiveCreators.length}</div>
            <div className="text-xs font-bold text-gray-500 mt-1">
              No support in last 30 days
            </div>
          </div>
        </div>

        {/* Users Table */}
        <CreatorsTable
          creators={creators}
          title={searchQuery ? `Search Results: "${searchQuery}"` : 'All Creators'}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  )
}
