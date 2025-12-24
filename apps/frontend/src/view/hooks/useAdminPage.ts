import type { GridPaginationModel } from '@mui/x-data-grid'
import { useState } from 'react'

import type { User } from '@/domain/user/user.js'
import { useUsers } from '@/view/hooks/queries/useUsers.js'

interface UseAdminPageReturn {
  currentUserRole: 'admin' | 'moderator' | 'user'
  error: string | null
  handlePaginationChange: (model: GridPaginationModel) => void
  handleSearchChange: (query: string) => void
  loading: boolean
  paginationModel: GridPaginationModel
  rowCount: number
  searchQuery: string
  users: readonly User[]
}

/**
 * Custom hook for admin page logic following DDD architecture.
 * Handles user data fetching, pagination, search, and error states.
 * Uses TanStack Query for automatic caching, refetching, and state management.
 */
export function useAdminPage(): UseAdminPageReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  })

  // TODO: Replace with actual user role from authentication
  const currentUserRole = 'admin' as 'admin' | 'moderator' | 'user'

  // Use TanStack Query hook for data fetching with automatic caching
  const { error, isLoading, total, users } = useUsers({
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
  })

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model)
  }

  return {
    currentUserRole,
    error,
    handlePaginationChange,
    handleSearchChange,
    loading: isLoading,
    paginationModel,
    rowCount: total,
    searchQuery,
    users,
  }
}
