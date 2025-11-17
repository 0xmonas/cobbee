import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import {
  Wallet,
  AlertTriangle,
  Ban,
  Coffee,
  TrendingUp,
} from 'lucide-react'
import { WalletBlacklistActions } from '@/components/admin/wallet-blacklist-actions'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'

export const metadata = {
  title: 'Wallets & Blacklist - Admin - Cobbee',
  description: 'Monitor wallets and manage blacklist',
}

interface SuspiciousWallet {
  id: string
  wallet_address: string
  used_names: string[]
  name_variation_count: number
  total_support_count: number
  total_creators_supported: number
  first_seen_at: string
  last_seen_at: string
  is_blacklisted: boolean
  blacklist_reason: string | null
  supports_last_7_days: number
  volume_last_7_days: number
  creators_last_7_days: number
  fraud_risk_score: number
}

interface BlacklistedWallet {
  id: string
  wallet_address: string
  reason: string
  notes: string | null
  blacklisted_by: string
  blacklisted_at: string
  ban_scope: string
}

export default async function AdminWalletsPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/wallets')
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

  // Use admin client to fetch data
  const adminSupabase = createAdminClient()

  // Fetch suspicious wallets
  const { data: suspiciousWallets } = await adminSupabase
    .from('admin_suspicious_wallets')
    .select('*')
    .limit(20)

  // Fetch blacklisted wallets
  const { data: blacklistedWallets } = await adminSupabase
    .from('blacklisted_wallets')
    .select('*')
    .order('blacklisted_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader title="Wallets & Blacklist" icon={<Wallet className="w-8 h-8" />} />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminStatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            iconColor="text-orange-600"
            label="Suspicious Wallets"
            value={suspiciousWallets?.length || 0}
          />
          <AdminStatCard
            icon={<Ban className="w-6 h-6" />}
            iconColor="text-red-600"
            label="Blacklisted Wallets"
            value={blacklistedWallets?.length || 0}
          />
        </div>

        {/* Suspicious Wallets */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#FF6B35] border-b-4 border-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white" />
              <h2 className="text-2xl font-black text-white">Suspicious Wallets</h2>
            </div>
            <span className="text-sm font-bold text-white">
              High fraud risk score
            </span>
          </div>
          <div className="p-6">
            {suspiciousWallets && suspiciousWallets.length > 0 ? (
              <div className="space-y-4">
                {suspiciousWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="border-4 border-black rounded-2xl p-6 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-lg font-black">
                            {wallet.wallet_address?.slice(0, 12) || ''}...
                            {wallet.wallet_address?.slice(-10) || ''}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black border-2 border-black ${
                              (wallet.fraud_risk_score ?? 0) >= 6
                                ? 'bg-red-500 text-white'
                                : (wallet.fraud_risk_score ?? 0) >= 4
                                ? 'bg-orange-400 text-black'
                                : 'bg-yellow-300 text-black'
                            }`}
                          >
                            Risk: {wallet.fraud_risk_score ?? 0}/8
                          </span>
                        </div>

                        {/* Used Names */}
                        <div className="mb-3">
                          <span className="text-sm font-bold text-gray-600">
                            Used Names ({wallet.name_variation_count ?? 0}):
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {JSON.parse(wallet.used_names as any).slice(0, 5).map((name: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-white border-2 border-black rounded-lg text-xs font-bold"
                              >
                                {name}
                              </span>
                            ))}
                            {(wallet.name_variation_count ?? 0) > 5 && (
                              <span className="px-2 py-1 bg-gray-200 border-2 border-black rounded-lg text-xs font-bold">
                                +{(wallet.name_variation_count ?? 0) - 5} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-white border-2 border-black rounded-lg p-3">
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Total Supports
                            </div>
                            <div className="text-xl font-black">
                              {wallet.total_support_count}
                            </div>
                          </div>
                          <div className="bg-white border-2 border-black rounded-lg p-3">
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Last 7 Days
                            </div>
                            <div className="text-xl font-black">
                              {wallet.supports_last_7_days}
                            </div>
                          </div>
                          <div className="bg-white border-2 border-black rounded-lg p-3">
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Creators Supported
                            </div>
                            <div className="text-xl font-black">
                              {wallet.total_creators_supported}
                            </div>
                          </div>
                          <div className="bg-white border-2 border-black rounded-lg p-3">
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Volume (7d)
                            </div>
                            <div className="text-xl font-black">
                              ${(wallet.volume_last_7_days ?? 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="mt-3 flex items-center gap-4 text-xs font-bold text-gray-600">
                          <span>
                            First seen: {wallet.first_seen_at ? new Date(wallet.first_seen_at).toLocaleDateString() : 'N/A'}
                          </span>
                          <span>
                            Last seen: {wallet.last_seen_at ? new Date(wallet.last_seen_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        <WalletBlacklistActions
                          walletAddress={wallet.wallet_address || ''}
                          isBlacklisted={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl font-bold text-gray-500">
                  No suspicious wallets detected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Blacklisted Wallets */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-gray-800 border-b-4 border-black p-4 flex items-center gap-3">
            <Ban className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-black text-white">Blacklisted Wallets</h2>
          </div>
          <div className="p-6">
            {blacklistedWallets && blacklistedWallets.length > 0 ? (
              <div className="space-y-4">
                {blacklistedWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="border-4 border-black rounded-2xl p-6 bg-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-lg font-black">
                            {wallet.wallet_address.slice(0, 12)}...
                            {wallet.wallet_address.slice(-10)}
                          </span>
                          <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black border-2 border-black">
                            BLACKLISTED
                          </span>
                          <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-black border-2 border-black uppercase">
                            {wallet.ban_scope}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-bold text-gray-600">Reason: </span>
                            <span className="font-bold">{wallet.reason}</span>
                          </div>
                          {wallet.notes && (
                            <div>
                              <span className="text-sm font-bold text-gray-600">Notes: </span>
                              <span className="font-bold">{wallet.notes}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                            <span>
                              Blacklisted by: {wallet.blacklisted_by?.slice(0, 10) || 'Unknown'}...
                            </span>
                            <span>
                              Date: {wallet.blacklisted_at ? new Date(wallet.blacklisted_at).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        <WalletBlacklistActions
                          walletAddress={wallet.wallet_address}
                          isBlacklisted={true}
                          currentReason={wallet.reason}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Ban className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl font-bold text-gray-500">No blacklisted wallets</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
