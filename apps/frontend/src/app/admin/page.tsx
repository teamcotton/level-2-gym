'use client'

import { AdminPage } from '@/view/components/AdminPage.js'
import { useAdminPage } from '@/view/hooks/useAdminPage.js'

/**
 * Admin page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export default function AdminPageContainer() {
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
