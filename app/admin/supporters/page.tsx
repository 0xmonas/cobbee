import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import Link from 'next/link'
import {
  ArrowLeft,
  Users,
  Search,
  Shield,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react'
import { SupporterSearchForm } from '@/components/admin/supporter-search-form'
import { SupportersTable } from '@/components/admin/supporters-table'

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
                <h1 className="text-3xl font-black text-white">Supporter Management</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

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
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-[#0000FF]" />
              <span className="font-bold text-gray-600">Total Supporters</span>
            </div>
            <div className="text-3xl font-black">{totalSupporters}</div>
          </div>

          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-600">Total Supports</span>
            </div>
            <div className="text-3xl font-black">{totalSupports}</div>
          </div>

          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <span className="font-bold text-gray-600">Suspicious</span>
            </div>
            <div className="text-3xl font-black">{suspiciousCount}</div>
          </div>

          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-red-600" />
              <span className="font-bold text-gray-600">Blacklisted</span>
            </div>
            <div className="text-3xl font-black">{blacklistedCount}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/admin/supporters${searchQuery ? `?search=${searchQuery}` : ''}`}
              className={`px-6 py-3 rounded-xl border-4 border-black font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#0000FF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              All Supporters ({totalSupporters})
            </Link>
            <Link
              href={`/admin/supporters?tab=suspicious${searchQuery ? `&search=${searchQuery}` : ''}`}
              className={`px-6 py-3 rounded-xl border-4 border-black font-bold transition-all ${
                activeTab === 'suspicious'
                  ? 'bg-orange-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              Suspicious ({suspiciousCount})
            </Link>
            <Link
              href={`/admin/supporters?tab=blacklisted${searchQuery ? `&search=${searchQuery}` : ''}`}
              className={`px-6 py-3 rounded-xl border-4 border-black font-bold transition-all ${
                activeTab === 'blacklisted'
                  ? 'bg-red-600 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              Blacklisted ({blacklistedCount})
            </Link>
          </div>
        </div>

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
