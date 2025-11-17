"use client"

import { AdminDataTable, ColumnConfig } from './admin-data-table'
import { Calendar, TrendingUp, Users as UsersIcon, Shield } from 'lucide-react'

interface SupporterWallet {
  id: string
  wallet_address: string
  total_support_count: number
  total_creators_supported: number
  first_seen_at: string | null
  last_seen_at: string | null
  is_blacklisted: boolean
  blacklist_reason: string | null
}

interface SupportersTableProps {
  supporters: SupporterWallet[]
  title: string
  searchQuery?: string
}

export function SupportersTable({ supporters, title, searchQuery }: SupportersTableProps) {
  const columns: ColumnConfig<SupporterWallet>[] = [
    {
      header: 'Wallet Address',
      align: 'left',
      render: (supporter) => (
        <div>
          <div className="font-mono font-black text-lg">
            {supporter.wallet_address?.slice(0, 12)}...
            {supporter.wallet_address?.slice(-10)}
          </div>
          {supporter.is_blacklisted && (
            <span className="inline-flex items-center gap-1 px-3 py-1 mt-2 rounded-full bg-red-600 text-white text-xs font-black border-2 border-black">
              <Shield className="w-3 h-3" />
              BLACKLISTED
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Activity',
      align: 'right',
      render: (supporter) => (
        <div className="space-y-1">
          <div className="flex items-center justify-end gap-2 text-sm font-bold">
            <TrendingUp className="w-4 h-4" />
            {supporter.total_support_count || 0} supports
          </div>
          <div className="flex items-center justify-end gap-2 text-sm font-bold text-gray-600">
            <UsersIcon className="w-4 h-4" />
            {supporter.total_creators_supported || 0} creators
          </div>
        </div>
      ),
    },
    {
      header: 'First Seen',
      align: 'center',
      render: (supporter) => (
        <div className="flex items-center justify-center gap-2 text-sm font-bold">
          <Calendar className="w-4 h-4 text-gray-500" />
          {supporter.first_seen_at
            ? new Date(supporter.first_seen_at).toLocaleDateString()
            : 'N/A'}
        </div>
      ),
    },
    {
      header: 'Last Seen',
      align: 'center',
      render: (supporter) => (
        <div className="flex items-center justify-center gap-2 text-sm font-bold">
          <Calendar className="w-4 h-4 text-gray-500" />
          {supporter.last_seen_at
            ? new Date(supporter.last_seen_at).toLocaleDateString()
            : 'N/A'}
        </div>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      render: (supporter) => (
        <div>
          {supporter.is_blacklisted ? (
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 border-2 border-red-600 text-xs font-black">
                Blacklisted
              </span>
              {supporter.blacklist_reason && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-2 max-w-xs">
                  <div className="text-xs font-bold text-red-800 mb-1">Reason:</div>
                  <p className="text-xs font-bold text-red-900">{supporter.blacklist_reason}</p>
                </div>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 border-2 border-green-600 text-xs font-black">
              Active
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminDataTable
      title={title}
      data={supporters}
      columns={columns}
      emptyMessage={
        searchQuery ? 'No supporters found matching your search' : 'No supporters found'
      }
      emptySubMessage={searchQuery ? 'Try a different search term' : undefined}
      getRowKey={(supporter) => supporter.id}
    />
  )
}
