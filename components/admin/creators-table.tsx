"use client"

import { AdminDataTable, ColumnConfig } from './admin-data-table'
import {
  Calendar,
  Mail,
  Wallet,
  Coffee,
  Users as UsersIcon,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { UserModerationActions } from './user-moderation-actions'

interface Creator {
  id: string
  username: string
  display_name: string
  email: string | null
  wallet_address: string | null
  created_at: string
  total_supports: number
  total_supporters: number
  total_earnings: number
  earnings_last_30_days: number
  supports_last_30_days: number
  is_blocked: boolean
  blocked_reason: string | null
}

interface CreatorsTableProps {
  creators: Creator[]
  title: string
  searchQuery?: string
}

export function CreatorsTable({ creators, title, searchQuery }: CreatorsTableProps) {
  const columns: ColumnConfig<Creator>[] = [
    {
      header: 'User',
      align: 'left',
      render: (creator) => (
        <div>
          <div className="font-black text-lg">{creator.display_name}</div>
          <div className="text-sm font-bold text-gray-600">@{creator.username}</div>
          <div className="flex items-center gap-2 mt-1 text-xs font-bold text-gray-500">
            <Calendar className="w-3 h-3" />
            {new Date(creator.created_at).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      align: 'left',
      render: (creator) => (
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
      ),
    },
    {
      header: 'Stats',
      align: 'right',
      render: (creator) => (
        <div className="space-y-1">
          <div className="flex items-center justify-end gap-2 text-sm font-bold">
            <Coffee className="w-4 h-4" />
            {creator.total_supports} supports
          </div>
          <div className="flex items-center justify-end gap-2 text-sm font-bold text-gray-600">
            <UsersIcon className="w-4 h-4" />
            {creator.total_supporters} supporters
          </div>
        </div>
      ),
    },
    {
      header: 'Earnings',
      align: 'right',
      render: (creator) => (
        <div className="space-y-1">
          <div className="flex items-center justify-end gap-2 font-black text-lg">
            <DollarSign className="w-5 h-5" />
            {creator.total_earnings.toFixed(2)}
          </div>
          <div className="text-xs font-bold text-gray-600">
            ${creator.earnings_last_30_days.toFixed(2)} (30d)
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      render: (creator) =>
        creator.supports_last_30_days > 0 ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 border-2 border-green-600 text-xs font-black">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 border-2 border-gray-400 text-xs font-black">
            <XCircle className="w-3 h-3" />
            Inactive
          </span>
        ),
    },
    {
      header: 'Actions',
      align: 'center',
      render: (creator) => (
        <div className="flex flex-col gap-2">
          <Link
            href={`/${creator.username}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0000FF] hover:bg-[#0000DD] text-white font-bold text-sm rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            View Profile
          </Link>
          <UserModerationActions
            userId={creator.id}
            username={creator.username}
            isBlocked={creator.is_blocked}
            blockedReason={creator.blocked_reason}
          />
        </div>
      ),
    },
  ]

  return (
    <AdminDataTable
      title={title}
      data={creators}
      columns={columns}
      emptyMessage={searchQuery ? `Search Results: "${searchQuery}"` : 'No users found'}
      emptySubMessage={searchQuery ? 'Try a different search term' : undefined}
      getRowKey={(creator) => creator.id}
    />
  )
}
