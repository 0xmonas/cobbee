import Link from 'next/link'
import { Search } from 'lucide-react'

interface AdminSearchFormProps {
  initialSearch: string
  placeholder: string
  basePath: string
  preserveParams?: Record<string, string>
}

/**
 * Generic Admin Search Form Component
 *
 * Reusable search form for admin pages (users, audit logs, supporters)
 * Matches the design from admin/users page
 */
export function AdminSearchForm({
  initialSearch,
  placeholder,
  basePath,
  preserveParams = {}
}: AdminSearchFormProps) {
  // Build clear URL with preserved params
  const clearParams = new URLSearchParams()
  Object.entries(preserveParams).forEach(([key, value]) => {
    if (value) {
      clearParams.set(key, value)
    }
  })
  const clearUrl = `${basePath}${clearParams.toString() ? `?${clearParams.toString()}` : ''}`

  return (
    <form method="GET" action={basePath} className="flex items-center gap-4">
      {/* Preserve additional parameters as hidden inputs */}
      {Object.entries(preserveParams).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null
      )}

      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          name="search"
          defaultValue={initialSearch}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 text-lg font-bold border-4 border-black rounded-xl focus:ring-4 focus:ring-[#CCFF00]"
        />
      </div>
      <button
        type="submit"
        className="bg-[#0000FF] hover:bg-[#0000DD] text-white font-black text-lg px-8 py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        Search
      </button>
      {initialSearch && (
        <Link
          href={clearUrl}
          className="bg-gray-200 hover:bg-gray-300 text-black font-bold text-lg px-6 py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          Clear
        </Link>
      )}
    </form>
  )
}
