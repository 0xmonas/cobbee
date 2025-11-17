import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ReactNode } from 'react'

interface AdminPageHeaderProps {
  title: string
  icon: ReactNode
  backUrl?: string
  actions?: ReactNode
}

/**
 * Generic Admin Page Header Component
 *
 * Reusable header for admin pages
 * Blue background with back button, icon, title, and optional actions
 */
export function AdminPageHeader({
  title,
  icon,
  backUrl = '/admin',
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="border-b-4 border-black bg-[#0000FF]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={backUrl}
              className="flex items-center gap-2 text-white hover:text-[#CCFF00] transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
              <span className="font-bold">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-white">{icon}</div>
              <h1 className="text-3xl font-black text-white">{title}</h1>
            </div>
          </div>
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </header>
  )
}
