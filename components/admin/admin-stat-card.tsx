import { ReactNode } from 'react'

interface AdminStatCardProps {
  icon: ReactNode
  iconColor?: string
  label: string
  value: number | string
  subtitle?: string
}

/**
 * Generic Admin Stat Card Component
 *
 * Reusable stat card for admin dashboard pages
 * Neo-brutalist design with icon, label, value, and optional subtitle
 */
export function AdminStatCard({
  icon,
  iconColor = 'text-[#0000FF]',
  label,
  value,
  subtitle,
}: AdminStatCardProps) {
  return (
    <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-6 h-6 ${iconColor}`}>{icon}</div>
        <span className="font-bold text-gray-600">{label}</span>
      </div>
      <div className="text-3xl font-black">{value}</div>
      {subtitle && (
        <div className="text-xs font-bold text-gray-500 mt-1">{subtitle}</div>
      )}
    </div>
  )
}
