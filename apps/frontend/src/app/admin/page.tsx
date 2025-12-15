'use client'

import { Alert, Box, Container, TextField, Typography } from '@mui/material'
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid'
import { useEffect, useState } from 'react'

import type { PaginatedUsersResponse, User } from '@/domain/user/user.js'

export default function AdminPage() {
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
      try {
        setLoading(true)
        const limit = paginationModel.pageSize
        const offset = paginationModel.page * paginationModel.pageSize

        const response = await fetch(`/api/users?limit=${limit}&offset=${offset}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        })

        if (!response.ok) {
          setError(
            `Failed to load users: Server returned ${response.status} ${response.statusText}. Please try refreshing the page.`
          )
          setUsers([])
          return
        }

        const data = (await response.json()) as PaginatedUsersResponse

        // Map userId to id for MUI DataGrid compatibility
        const mappedUsers =
          data.data?.map((user) => ({
            id: user.userId,
            name: user.name,
            email: user.email,
            role: user.role as 'user' | 'admin' | 'moderator',
            createdAt: user.createdAt,
          })) || []

        setUsers(mappedUsers)
        setRowCount(data.pagination?.total ?? 0)
        setError(null)
      } catch (err) {
        console.warn('Error fetching users:', err)
        setError(
          'Unable to load users: Network error or server unavailable. Please check your connection and try again.'
        )
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [paginationModel])

  // Define columns
  const columns: GridColDef<User>[] = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'role', headerName: 'Role', width: 150 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 200,
      valueFormatter: (value) => new Date(value).toLocaleDateString(),
    },
  ]

  // Filter users based on search query (searches name, email, and role)
  // Note: This is client-side filtering on the current page only
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  })

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {currentUserRole === 'admin'
            ? 'Manage user accounts and roles'
            : 'View user accounts (read-only access)'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <TextField
          label="Search users (current page only)"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
          placeholder="Search by name, email, or role..."
          helperText="Note: Search filters users on the current page only"
        />
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          checkboxSelection={currentUserRole === 'admin'}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              cursor: currentUserRole === 'admin' ? 'pointer' : 'default',
            },
          }}
        />
      </Box>

      {currentUserRole === 'moderator' && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Note: You have read-only access. Contact an administrator to modify user data.
        </Typography>
      )}
    </Container>
  )
}
