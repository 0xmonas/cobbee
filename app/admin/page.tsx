import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import Link from 'next/link'
import {
  Users,
  Wallet,
  TrendingUp,
  Activity,
  AlertTriangle,
  Bell,
  BarChart3,
  Shield,
  Clock,
  DollarSign,
  Coffee,
} from 'lucide-react'

export const metadata = {
  title: 'Admin Dashboard - Cobbee',
  description: 'Platform administration and monitoring',
}

interface PlatformStats {
  total_active_creators: number
  total_inactive_creators: number
  new_creators_last_7_days: number
  new_creators_last_30_days: number
  total_confirmed_supports: number
  total_pending_supports: number
  total_failed_supports: number
  total_platform_volume_usd: number
  total_unique_supporters: number
  supports_last_24h: number
  volume_last_24h: number
  signups_last_24h: number
  total_blacklisted_wallets: number
  total_flagged_wallets: number
  notifications_sent_24h: number
  total_unread_notifications: number
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin')
  }

  // Get user's wallet address
  const { data: userProfile } = await supabase
    .from('users')
    .select('wallet_address, username')
    .eq('id', authUser.id)
    .single()

  const walletAddress = userProfile?.wallet_address

  // Verify admin access
  if (!isAdminWallet(walletAddress)) {
    redirect('/dashboard')
  }

  // Use admin client to fetch stats
  const adminSupabase = createAdminClient()

  // Fetch platform stats
  const { data: stats, error: statsError } = await adminSupabase
    .from('admin_platform_stats')
    .select('*')
    .single()

  if (statsError) {
    console.error('Failed to fetch admin stats:', statsError)
  }

  const platformStats: PlatformStats = {
    total_active_creators: stats?.total_active_creators ?? 0,
    total_inactive_creators: stats?.total_inactive_creators ?? 0,
    new_creators_last_7_days: stats?.new_creators_last_7_days ?? 0,
    new_creators_last_30_days: stats?.new_creators_last_30_days ?? 0,
    total_confirmed_supports: stats?.total_confirmed_supports ?? 0,
    total_pending_supports: stats?.total_pending_supports ?? 0,
    total_failed_supports: stats?.total_failed_supports ?? 0,
    total_platform_volume_usd: stats?.total_platform_volume_usd ?? 0,
    total_unique_supporters: stats?.total_unique_supporters ?? 0,
    supports_last_24h: stats?.supports_last_24h ?? 0,
    volume_last_24h: stats?.volume_last_24h ?? 0,
    signups_last_24h: stats?.signups_last_24h ?? 0,
    total_blacklisted_wallets: stats?.total_blacklisted_wallets ?? 0,
    total_flagged_wallets: stats?.total_flagged_wallets ?? 0,
    notifications_sent_24h: stats?.notifications_sent_24h ?? 0,
    total_unread_notifications: stats?.total_unread_notifications ?? 0,
  }

  // Fetch recent failed payments
  const { data: failedPayments } = await adminSupabase
    .from('admin_failed_payments')
    .select('*')
    .limit(5)

  // Fetch suspicious wallets
  const { data: suspiciousWallets } = await adminSupabase
    .from('admin_suspicious_wallets')
    .select('wallet_address, fraud_risk_score, supports_last_7_days, name_variation_count')
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-4 border-black bg-[#0000FF]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-white">
                @{userProfile?.username}
              </span>
              <Link
                href="/dashboard"
                className="bg-white hover:bg-gray-100 text-black font-bold px-4 py-2 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Creators */}
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Total Creators"
            value={platformStats.total_active_creators}
            subtitle={`${platformStats.new_creators_last_7_days} new (7d)`}
            color="bg-[#0000FF]"
          />

          {/* Total Volume */}
          <StatCard
            icon={<DollarSign className="w-8 h-8" />}
            title="Total Volume"
            value={`$${platformStats.total_platform_volume_usd.toFixed(2)}`}
            subtitle={`$${platformStats.volume_last_24h.toFixed(2)} (24h)`}
            color="bg-[#CCFF00]"
            textColor="text-black"
          />

          {/* Total Supports */}
          <StatCard
            icon={<Coffee className="w-8 h-8" />}
            title="Total Supports"
            value={platformStats.total_confirmed_supports}
            subtitle={`${platformStats.supports_last_24h} today`}
            color="bg-[#FF6B35]"
          />

          {/* Unique Supporters */}
          <StatCard
            icon={<Wallet className="w-8 h-8" />}
            title="Unique Supporters"
            value={platformStats.total_unique_supporters}
            subtitle={`${platformStats.total_blacklisted_wallets} blacklisted`}
            color="bg-gray-800"
          />
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MiniStatCard
            icon={<Activity className="w-6 h-6" />}
            label="Pending Supports"
            value={platformStats.total_pending_supports}
            trend={platformStats.total_pending_supports > 10 ? 'warning' : 'normal'}
          />
          <MiniStatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Failed Supports (7d)"
            value={platformStats.total_failed_supports}
            trend={platformStats.total_failed_supports > 20 ? 'danger' : 'normal'}
          />
          <MiniStatCard
            icon={<Bell className="w-6 h-6" />}
            label="Notifications (24h)"
            value={platformStats.notifications_sent_24h}
            trend="normal"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Suspicious Wallets */}
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-[#FF6B35] border-b-4 border-black p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-black text-white">Suspicious Wallets</h2>
              </div>
              <Link
                href="/admin/wallets"
                className="text-sm font-bold text-white hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="p-6">
              {suspiciousWallets && suspiciousWallets.length > 0 ? (
                <div className="space-y-3">
                  {suspiciousWallets.map((wallet, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-black rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-bold">
                          {wallet.wallet_address?.slice(0, 10) ?? 'N/A'}...
                          {wallet.wallet_address?.slice(-8) ?? ''}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-black border-2 border-black ${
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
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-600">
                        <span>{wallet.supports_last_7_days} supports (7d)</span>
                        <span>{wallet.name_variation_count} names</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 font-bold py-8">
                  No suspicious activity detected
                </p>
              )}
            </div>
          </div>

          {/* Recent Failed Payments */}
          <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="bg-gray-800 border-b-4 border-black p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-white" />
                <h2 className="text-2xl font-black text-white">Failed Payments</h2>
              </div>
              <span className="text-sm font-bold text-white">Last 7 days</span>
            </div>
            <div className="p-6">
              {failedPayments && failedPayments.length > 0 ? (
                <div className="space-y-3">
                  {failedPayments.map((payment, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-black rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">
                          {payment.supporter_name} → @{payment.creator_username}
                        </span>
                        <span className="font-black">${payment.total_amount}</span>
                      </div>
                      <div className="text-xs font-bold text-gray-600">
                        {payment.coffee_count}x coffees •{' '}
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 font-bold py-8">
                  No failed payments
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#CCFF00] border-b-4 border-black p-4">
            <h2 className="text-2xl font-black">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <ActionButton
                href="/admin/users"
                icon={<Users className="w-6 h-6" />}
                label="Manage Users"
              />
              <ActionButton
                href="/admin/supporters"
                icon={<Wallet className="w-6 h-6" />}
                label="Manage Supporters"
              />
              <ActionButton
                href="/admin/wallets"
                icon={<AlertTriangle className="w-6 h-6" />}
                label="Suspicious Wallets"
              />
              <ActionButton
                href="/admin/audit"
                icon={<Activity className="w-6 h-6" />}
                label="Audit Logs"
              />
              <ActionButton
                href="/admin/analytics"
                icon={<BarChart3 className="w-6 h-6" />}
                label="Analytics"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: string
  textColor?: string
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
  textColor = 'text-white',
}: StatCardProps) {
  return (
    <div className="border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className={`${color} ${textColor} border-b-4 border-black p-4`}>
        <div className="flex items-center gap-2 mb-2">{icon}</div>
        <div className="text-sm font-bold opacity-90 mb-1">{title}</div>
        <div className="text-3xl font-black mb-1">{value}</div>
        <div className="text-xs font-bold opacity-80">{subtitle}</div>
      </div>
    </div>
  )
}

interface MiniStatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  trend: 'normal' | 'warning' | 'danger'
}

function MiniStatCard({ icon, label, value, trend }: MiniStatCardProps) {
  const bgColor =
    trend === 'danger'
      ? 'bg-red-100 border-red-500'
      : trend === 'warning'
      ? 'bg-yellow-100 border-yellow-500'
      : 'bg-gray-100 border-gray-400'

  return (
    <div className={`border-4 ${bgColor} border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white border-2 border-black rounded-lg">{icon}</div>
        <div>
          <div className="text-sm font-bold text-gray-600">{label}</div>
          <div className="text-2xl font-black">{value}</div>
        </div>
      </div>
    </div>
  )
}

interface ActionButtonProps {
  href: string
  icon: React.ReactNode
  label: string
}

function ActionButton({ href, icon, label }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-3 p-6 border-4 border-black bg-white hover:bg-gray-50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl"
    >
      <div className="p-3 bg-[#CCFF00] border-4 border-black rounded-full">{icon}</div>
      <span className="text-lg font-black text-center">{label}</span>
    </Link>
  )
}
