import { AdminSearchForm } from './admin-search-form'

interface AuditSearchFormProps {
  initialSearch: string
  currentEvent: string
}

/**
 * Audit Log Search Form Wrapper
 * Uses generic AdminSearchForm with audit-specific configuration
 */
export function AuditSearchForm({ initialSearch, currentEvent }: AuditSearchFormProps) {
  return (
    <AdminSearchForm
      initialSearch={initialSearch}
      placeholder="Search by username, event type, or IP address..."
      basePath="/admin/audit"
      preserveParams={currentEvent ? { event: currentEvent } : {}}
    />
  )
}
