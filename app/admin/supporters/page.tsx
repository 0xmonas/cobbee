import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import {
  Users,
  Shield,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { SupporterSearchForm } from '@/components/admin/supporter-search-form'
import { SupportersTable } from '@/components/admin/supporters-table'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'
import { AdminFilterTabs } from '@/components/admin/admin-filter-tabs'

export const metadata = {
  title: 'Supporter Management - Admin - Cobbee',
  description: 'Manage supporter wallets and monitor activity',
}

export default async function AdminSupportersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; tab?: string }>
}) {
  const params = await searchParams
  const searchQuery = params.search || ''
  const activeTab = params.tab || 'all'

  const supabase = await createClient()

  // Check authentication
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/supporters')
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

  // Use admin client to fetch supporter data
  const adminSupabase = createAdminClient()

  // Fetch all supporter wallets
  let query = adminSupabase
    .from('supporter_wallets')
    .select('*')
    .order('last_seen_at', { ascending: false })

  if (searchQuery) {
    query = query.ilike('wallet_address', `%${searchQuery}%`)
  }

  const { data: allSupporters } = await query.limit(100)

  // Fetch suspicious wallets
  const { data: suspiciousWallets } = await adminSupabase
    .from('admin_suspicious_wallets')
    .select('*')
    .limit(50)

  // Calculate stats
  const totalSupporters = allSupporters?.length || 0
  const blacklistedCount = allSupporters?.filter(s => s.is_blacklisted).length || 0
  const suspiciousCount = suspiciousWallets?.length || 0

  const totalSupports = allSupporters?.reduce((sum, s) => sum + (s.total_support_count || 0), 0) || 0

  // Filter supporters based on active tab
  let displayedSupporters = allSupporters || []

  if (activeTab === 'blacklisted') {
    displayedSupporters = allSupporters?.filter(s => s.is_blacklisted) || []
  } else if (activeTab === 'suspicious') {
    const suspiciousAddresses = new Set(suspiciousWallets?.map(w => w.wallet_address) || [])
    displayedSupporters = allSupporters?.filter(s => suspiciousAddresses.has(s.wallet_address)) || []
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader title="Supporter Management" icon={<Users className="w-8 h-8" />} />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        {/* Search Bar */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <SupporterSearchForm
            initialSearch={searchQuery}
            currentTab={activeTab}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AdminStatCard
            icon={<Users className="w-6 h-6" />}
            iconColor="text-[#0000FF]"
            label="Total Supporters"
            value={totalSupporters}
          />
          <AdminStatCard
            icon={<TrendingUp className="w-6 h-6" />}
            iconColor="text-green-600"
            label="Total Supports"
            value={totalSupports}
          />
          <AdminStatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            iconColor="text-orange-600"
            label="Suspicious"
            value={suspiciousCount}
          />
          <AdminStatCard
            icon={<Shield className="w-6 h-6" />}
            iconColor="text-red-600"
            label="Blacklisted"
            value={blacklistedCount}
          />
        </div>

        {/* Tabs */}
        <AdminFilterTabs
          basePath="/admin/supporters"
          activeFilter={activeTab}
          filters={[
            { value: 'all', label: 'All Supporters', count: totalSupporters, color: 'blue' },
            { value: 'suspicious', label: 'Suspicious', count: suspiciousCount, color: 'orange' },
            { value: 'blacklisted', label: 'Blacklisted', count: blacklistedCount, color: 'red' },
          ]}
          preserveParams={{ search: searchQuery }}
        />

        {/* Supporters List */}
        <SupportersTable
          supporters={displayedSupporters}
          title={
            activeTab === 'all'
              ? 'All Supporters'
              : activeTab === 'suspicious'
              ? 'Suspicious Supporters'
              : 'Blacklisted Supporters'
          }
          searchQuery={searchQuery}
        />

        {/* Info Box */}
        <div className="border-4 border-black bg-blue-50 p-6 rounded-2xl">
          <div className="flex items-start gap-3">
            <Users className="w-6 h-6 text-[#0000FF] mt-1" />
            <div>
              <h3 className="font-black text-lg mb-2">About Supporter Management</h3>
              <p className="font-bold text-sm text-gray-700 leading-relaxed">
                This page allows you to monitor and manage supporter wallet activity across the platform.
                Suspicious wallets are automatically flagged based on behavior patterns like multiple name
                variations, high transaction frequency, or other fraud indicators. Blacklisted wallets
                cannot send new supports to creators.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
