import { AdminSearchForm } from './admin-search-form'

interface UserSearchFormProps {
  initialSearch: string
}

/**
 * User Search Form Wrapper
 * Uses generic AdminSearchForm with user-specific configuration
 */
export function UserSearchForm({ initialSearch }: UserSearchFormProps) {
  return (
    <AdminSearchForm
      initialSearch={initialSearch}
      placeholder="Search by username, email, or wallet address..."
      basePath="/admin/users"
    />
  )
}
