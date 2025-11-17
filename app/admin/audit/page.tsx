import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminWallet } from '@/lib/utils/admin'
import Link from 'next/link'
import {
  Activity,
  Shield,
  Coffee,
  User,
  Filter,
  Clock,
} from 'lucide-react'
import { AuditSearchForm } from '@/components/admin/audit-search-form'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminStatCard } from '@/components/admin/admin-stat-card'

export const metadata = {
  title: 'Audit Logs - Admin - Cobbee',
  description: 'Platform activity audit trail',
}

interface AuditLog {
  id: string
  event_type: string
  actor_type: string
  actor_id: string | null
  target_type: string | null
  target_id: string | null
  changes: any
  metadata: any
  ip_address: string | null
  created_at: string
  actor_username: string | null
  actor_display_name: string | null
}

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; search?: string }>
}) {
  const params = await searchParams
  const eventFilter = params.event || ''
  const searchQuery = params.search || ''

  const supabase = await createClient()

  // Check authentication
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/audit')
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

  // Use admin client to fetch audit logs
  const adminSupabase = createAdminClient()

  // Fetch recent audit logs
  let query = adminSupabase
    .from('admin_recent_activity')
    .select('*')

  if (eventFilter) {
    query = query.eq('event_type', eventFilter)
  }

  if (searchQuery) {
    query = query.or(`actor_username.ilike.%${searchQuery}%,actor_display_name.ilike.%${searchQuery}%,event_type.ilike.%${searchQuery}%,ip_address.ilike.%${searchQuery}%`)
  }

  const { data: auditLogs } = await query.limit(100)

  // Get unique event types for filter
  const { data: allLogs } = await adminSupabase
    .from('audit_logs')
    .select('event_type')
    .limit(1000)

  const eventTypes = [...new Set(allLogs?.map((log) => log.event_type) || [])]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminPageHeader title="Audit Logs" icon={<Activity className="w-8 h-8" />} />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-8">
        {/* Search Bar */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <AuditSearchForm
            initialSearch={searchQuery}
            currentEvent={eventFilter}
          />
        </div>

        {/* Filter Bar */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="flex items-center gap-4">
            <Filter className="w-6 h-6" />
            <span className="font-black text-lg">Filter by Event Type:</span>
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <Link
                href={`/admin/audit${searchQuery ? `?search=${searchQuery}` : ''}`}
                className={`px-4 py-2 rounded-lg border-4 border-black font-bold transition-all ${
                  !eventFilter
                    ? 'bg-[#0000FF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                All
              </Link>
              {eventTypes.slice(0, 6).map((type) => (
                <Link
                  key={type}
                  href={`/admin/audit?event=${type}${searchQuery ? `&search=${searchQuery}` : ''}`}
                  className={`px-4 py-2 rounded-lg border-4 border-black font-bold transition-all ${
                    eventFilter === type
                      ? 'bg-[#0000FF] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {type.replace(/_/g, ' ')}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AdminStatCard
            icon={<Activity className="w-6 h-6" />}
            iconColor="text-[#0000FF]"
            label="Total Events"
            value={auditLogs?.length || 0}
          />
          <AdminStatCard
            icon={<User className="w-6 h-6" />}
            iconColor="text-green-600"
            label="User Events"
            value={auditLogs?.filter((log) => log.actor_type === 'user').length || 0}
          />
          <AdminStatCard
            icon={<Shield className="w-6 h-6" />}
            iconColor="text-purple-600"
            label="Admin Events"
            value={auditLogs?.filter((log) => log.actor_type === 'admin').length || 0}
          />
          <AdminStatCard
            icon={<Coffee className="w-6 h-6" />}
            iconColor="text-orange-600"
            label="Support Events"
            value={auditLogs?.filter((log) => log.event_type?.includes('support_')).length || 0}
          />
        </div>

        {/* Audit Logs Table */}
        <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-[#CCFF00] border-b-4 border-black p-4">
            <h2 className="text-2xl font-black">
              {eventFilter ? `Event: ${eventFilter.replace(/_/g, ' ')}` : 'Recent Activity'}
            </h2>
          </div>
          <div className="p-6">
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border-2 border-black rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Event Type Badge */}
                          <span className="px-3 py-1 rounded-full bg-[#0000FF] text-white text-xs font-black border-2 border-black">
                            {log.event_type.replace(/_/g, ' ').toUpperCase()}
                          </span>

                          {/* Actor Type Badge */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black border-2 border-black ${
                              log.actor_type === 'admin'
                                ? 'bg-purple-500 text-white'
                                : log.actor_type === 'user'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-500 text-white'
                            }`}
                          >
                            {log.actor_type.toUpperCase()}
                          </span>

                          {/* Actor Info */}
                          {log.actor_username && (
                            <span className="font-bold">
                              @{log.actor_username}
                            </span>
                          )}
                        </div>

                        {/* Target Info */}
                        {log.target_type && log.target_id && (
                          <div className="text-sm font-bold text-gray-600 mb-2">
                            Target: {log.target_type} ({log.target_id.slice(0, 8)}...)
                          </div>
                        )}

                        {/* Metadata */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="bg-white border-2 border-gray-300 rounded-lg p-3 mb-2">
                            <div className="text-xs font-bold text-gray-600 mb-1">
                              Metadata:
                            </div>
                            <pre className="text-xs font-mono overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Changes */}
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-2">
                            <div className="text-xs font-bold text-yellow-800 mb-1">
                              Changes:
                            </div>
                            <pre className="text-xs font-mono overflow-x-auto">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                          {log.ip_address && (
                            <span className="font-mono">IP: {log.ip_address}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-xl font-bold text-gray-500">No audit logs found</p>
                {eventFilter && (
                  <Link
                    href="/admin/audit"
                    className="text-sm font-bold text-[#0000FF] hover:underline mt-2 inline-block"
                  >
                    Clear filter
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="border-4 border-black bg-blue-50 p-6 rounded-2xl">
          <div className="flex items-start gap-3">
            <Activity className="w-6 h-6 text-[#0000FF] mt-1" />
            <div>
              <h3 className="font-black text-lg mb-2">About Audit Logs</h3>
              <p className="font-bold text-sm text-gray-700 leading-relaxed">
                Audit logs track all important platform activities including user registrations,
                profile updates, support transactions, admin actions, and security events. Logs
                are retained for compliance and security monitoring purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
