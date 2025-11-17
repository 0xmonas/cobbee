import Link from 'next/link'

interface FilterTab {
  value: string
  label: string
  count?: number
  color?: 'blue' | 'orange' | 'red' | 'green'
}

interface AdminFilterTabsProps {
  basePath: string
  activeFilter: string
  filters: FilterTab[]
  preserveParams?: Record<string, string>
  paramName?: string
}

/**
 * Generic Admin Filter Tabs Component
 *
 * Reusable filter tabs for admin pages (supporters, audit, etc.)
 * Handles URL params and preserves search queries
 */
export function AdminFilterTabs({
  basePath,
  activeFilter,
  filters,
  preserveParams = {},
  paramName = 'tab',
}: AdminFilterTabsProps) {
  const buildUrl = (filterValue: string) => {
    const params = new URLSearchParams()

    // Add filter param if not the default 'all'
    if (filterValue && filterValue !== 'all') {
      params.set(paramName, filterValue)
    }

    // Preserve additional parameters
    Object.entries(preserveParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    return `${basePath}${queryString ? `?${queryString}` : ''}`
  }

  const getColorClasses = (color?: string, isActive?: boolean) => {
    if (isActive) {
      switch (color) {
        case 'orange':
          return 'bg-orange-500 text-white'
        case 'red':
          return 'bg-red-600 text-white'
        case 'green':
          return 'bg-green-600 text-white'
        case 'blue':
        default:
          return 'bg-[#0000FF] text-white'
      }
    }
    return 'bg-white hover:bg-gray-100'
  }

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4">
      <div className="flex items-center gap-3 flex-wrap">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value
          return (
            <Link
              key={filter.value}
              href={buildUrl(filter.value)}
              className={`px-6 py-3 rounded-xl border-4 border-black font-bold transition-all ${
                getColorClasses(filter.color, isActive)
              } ${
                isActive
                  ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                  : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {filter.label} {filter.count !== undefined && `(${filter.count})`}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
