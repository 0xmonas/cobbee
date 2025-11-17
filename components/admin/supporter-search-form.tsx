import { AdminSearchForm } from './admin-search-form'

interface SupporterSearchFormProps {
  initialSearch: string
  currentTab: string
}

/**
 * Supporter Search Form Wrapper
 * Uses generic AdminSearchForm with supporter-specific configuration
 */
export function SupporterSearchForm({ initialSearch, currentTab }: SupporterSearchFormProps) {
  return (
    <AdminSearchForm
      initialSearch={initialSearch}
      placeholder="Search by wallet address..."
      basePath="/admin/supporters"
      preserveParams={currentTab && currentTab !== 'all' ? { tab: currentTab } : {}}
    />
  )
}
