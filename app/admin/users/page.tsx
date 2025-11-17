import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import {
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { UserSearchForm } from '@/components/admin/user-search-form'
import { CreatorsTable } from '@/components/admin/creators-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'

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
      <AdminPageHeader title="Users Management" icon={<Users className="w-8 h-8" />} />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        {/* Search Bar */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <UserSearchForm initialSearch={searchQuery} />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AdminStatCard
            icon={<Users className="w-6 h-6" />}
            iconColor="text-[#0000FF]"
            label="Total Users"
            value={creators.length}
          />
          <AdminStatCard
            icon={<CheckCircle className="w-6 h-6" />}
            iconColor="text-green-600"
            label="Active Users"
            value={activeCreators.length}
            subtitle="Received support in last 30 days"
          />
          <AdminStatCard
            icon={<XCircle className="w-6 h-6" />}
            iconColor="text-red-600"
            label="Inactive Users"
            value={inactiveCreators.length}
            subtitle="No support in last 30 days"
          />
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
