'use client'

import { AdminPage } from '@/view/client-components/AdminPage.js'
import { useAdminPage } from '@/view/hooks/useAdminPage.js'

/** Admin page client component following DDD architecture.
 * This component is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export function AdminPageClient() {
  const {
    currentUserRole,
    error,
    handlePaginationChange,
    handleSearchChange,
    loading,
    paginationModel,
    rowCount,
    searchQuery,
    users,
  } = useAdminPage()

  return (
    <AdminPage
      users={users}
      error={error}
      loading={loading}
      searchQuery={searchQuery}
      paginationModel={paginationModel}
      rowCount={rowCount}
      currentUserRole={currentUserRole}
      onSearchChange={handleSearchChange}
      onPaginationChange={handlePaginationChange}
    />
  )
}
