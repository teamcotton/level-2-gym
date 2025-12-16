import type { GridPaginationModel } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'

import { findAllUsers } from '@/application/actions/findAllUsers.js'
import type { User } from '@/domain/user/user.js'

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
 */
export function useAdminPage(): UseAdminPageReturn {
  const [users, setUsers] = useState<readonly User[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  })
  const [rowCount, setRowCount] = useState(0)

  // TODO: Replace with actual user role from authentication
  const currentUserRole = 'admin' as 'admin' | 'moderator' | 'user'

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)

      const limit = paginationModel.pageSize
      const offset = paginationModel.page * paginationModel.pageSize

      const result = await findAllUsers({ limit, offset })

      if (result.success) {
        setUsers(result.users)
        setRowCount(result.total)
        setError(null)
      } else {
        setUsers([])
        setRowCount(0)
        setError(result.error || 'Failed to load users')
      }

      setLoading(false)
    }

    fetchUsers()
  }, [paginationModel])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
  }

  const handlePaginationChange = (model: GridPaginationModel) => {
    setPaginationModel(model)
  }

  return {
    users,
    error,
    loading,
    searchQuery,
    paginationModel,
    rowCount,
    currentUserRole,
    handleSearchChange,
    handlePaginationChange,
  }
}
