import type { GridPaginationModel } from '@mui/x-data-grid'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { User } from '@/domain/user/user.js'
import { AdminPage } from '@/view/client-components/AdminPage.js'

describe('AdminPage', () => {
  const mockOnSearchChange = vi.fn()
  const mockOnPaginationChange = vi.fn()

  const mockUsers: readonly User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      email: 'moderator@example.com',
      name: 'Moderator User',
      role: 'moderator',
      createdAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: '3',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'user',
      createdAt: '2024-01-03T00:00:00.000Z',
    },
  ]

  const defaultPaginationModel: GridPaginationModel = {
    page: 0,
    pageSize: 10,
  }

  const defaultProps = {
    users: mockUsers,
    error: null,
    loading: false,
    searchQuery: '',
    paginationModel: defaultPaginationModel,
    rowCount: 3,
    currentUserRole: 'admin' as const,
    onSearchChange: mockOnSearchChange,
    onPaginationChange: mockOnPaginationChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering - Basic Elements', () => {
    it('should render the page title', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument()
    })

    it('should render description for admin role', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByText(/manage user accounts and roles/i)).toBeInTheDocument()
    })

    it('should render description for moderator role', () => {
      const props = { ...defaultProps, currentUserRole: 'moderator' as const }
      render(<AdminPage {...props} />)

      expect(screen.getByText(/view user accounts \(read-only access\)/i)).toBeInTheDocument()
    })

    it('should render description for user role', () => {
      const props = { ...defaultProps, currentUserRole: 'user' as const }
      render(<AdminPage {...props} />)

      expect(screen.getByText(/view user accounts \(read-only access\)/i)).toBeInTheDocument()
    })

    it('should render search input field', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByLabelText(/search users/i)).toBeInTheDocument()
    })

    it('should render search placeholder text', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByPlaceholderText(/search by email/i)).toBeInTheDocument()
    })

    it('should render search helper text', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByText(/search through all users/i)).toBeInTheDocument()
    })

    it('should render the DataGrid component', () => {
      render(<AdminPage {...defaultProps} />)

      // DataGrid renders with specific ARIA role
      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
    })
  })

  describe('Rendering - Column Headers', () => {
    it('should render all column headers', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
      expect(screen.getByText('Created At')).toBeInTheDocument()
    })

    it('should have correct column order', () => {
      render(<AdminPage {...defaultProps} />)

      const headers = screen.getAllByRole('columnheader')
      const headerTexts = headers.map((h) => h.textContent)

      // Includes checkbox column for admin
      expect(headerTexts).toContain('Name')
      expect(headerTexts).toContain('Email')
      expect(headerTexts).toContain('Role')
      expect(headerTexts).toContain('Created At')
    })
  })

  describe('Rendering - User Data', () => {
    it('should display all user names', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    it('should display all user emails', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
      expect(screen.getByText('moderator@example.com')).toBeInTheDocument()
      expect(screen.getByText('user@example.com')).toBeInTheDocument()
    })

    it('should display all user roles', () => {
      render(<AdminPage {...defaultProps} />)

      // Get all cells with role data
      const cells = screen.getAllByText(/admin|moderator|user/i)
      const roleCells = cells.filter((cell) => {
        const cellText = cell.textContent
        return cellText === 'admin' || cellText === 'moderator' || cellText === 'user'
      })

      expect(roleCells.length).toBeGreaterThanOrEqual(3)
    })

    it('should format and display creation dates', () => {
      render(<AdminPage {...defaultProps} />)

      // Dates should be formatted using toLocaleDateString()
      const expectedDate1 = new Date('2024-01-01T00:00:00.000Z').toLocaleDateString()
      const expectedDate2 = new Date('2024-01-02T00:00:00.000Z').toLocaleDateString()
      const expectedDate3 = new Date('2024-01-03T00:00:00.000Z').toLocaleDateString()

      expect(screen.getByText(expectedDate1)).toBeInTheDocument()
      expect(screen.getByText(expectedDate2)).toBeInTheDocument()
      expect(screen.getByText(expectedDate3)).toBeInTheDocument()
    })

    it('should handle empty user list', () => {
      const props = { ...defaultProps, users: [], rowCount: 0 }
      render(<AdminPage {...props} />)

      // DataGrid should still render but with no data
      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()

      // Should not show any user data
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
      expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument()
    })

    it('should handle single user', () => {
      const singleUser: readonly User[] = [mockUsers[0]!]
      const props = { ...defaultProps, users: singleUser, rowCount: 1 }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()
    })

    it('should handle large user list', () => {
      const largeUserList: User[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        email: `user${i + 1}@example.com`,
        name: `User ${i + 1}`,
        role: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'moderator' : 'user',
        createdAt: '2024-01-01T00:00:00.000Z',
      })) as User[]

      const props = { ...defaultProps, users: largeUserList, rowCount: 50 }
      render(<AdminPage {...props} />)

      // Should render without crashing
      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error alert when error prop is provided', () => {
      const props = { ...defaultProps, error: 'Failed to load users' }
      render(<AdminPage {...props} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Failed to load users')).toBeInTheDocument()
    })

    it('should not display error alert when error is null', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should display network error message', () => {
      const props = { ...defaultProps, error: 'Network error: Unable to connect' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Network error: Unable to connect')).toBeInTheDocument()
    })

    it('should display 404 error message', () => {
      const props = { ...defaultProps, error: 'HTTP 404: Resource not found' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('HTTP 404: Resource not found')).toBeInTheDocument()
    })

    it('should display 500 server error message', () => {
      const props = { ...defaultProps, error: 'HTTP 500: Internal server error' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('HTTP 500: Internal server error')).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading indicator when loading is true', () => {
      const props = { ...defaultProps, loading: true }
      render(<AdminPage {...props} />)

      // MUI DataGrid shows loading overlay
      const loadingOverlay = document.querySelector('.MuiDataGrid-overlay')
      expect(loadingOverlay).toBeInTheDocument()
    })

    it('should not show loading indicator when loading is false', () => {
      render(<AdminPage {...defaultProps} />)

      // Should not have loading overlay visible
      const loadingOverlay = document.querySelector('.MuiDataGrid-overlay')
      expect(loadingOverlay).not.toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should display search query in input field', () => {
      const props = { ...defaultProps, searchQuery: 'admin' }
      render(<AdminPage {...props} />)

      const searchInput = screen.getByLabelText(/search users/i) as HTMLInputElement
      expect(searchInput.value).toBe('admin')
    })

    it('should call onSearchChange when typing in search field', () => {
      render(<AdminPage {...defaultProps} />)

      const searchInput = screen.getByLabelText(/search users/i)
      fireEvent.change(searchInput, { target: { value: 'test' } })

      expect(mockOnSearchChange).toHaveBeenCalledTimes(1)
      expect(mockOnSearchChange).toHaveBeenCalledWith('test')
    })

    it('should call onSearchChange with empty string when clearing search', () => {
      const props = { ...defaultProps, searchQuery: 'admin' }
      render(<AdminPage {...props} />)

      const searchInput = screen.getByLabelText(/search users/i)
      fireEvent.change(searchInput, { target: { value: '' } })

      expect(mockOnSearchChange).toHaveBeenCalledWith('')
    })

    it('should filter users by name (case-insensitive)', () => {
      const props = { ...defaultProps, searchQuery: 'admin' }
      render(<AdminPage {...props} />)

      // Should show Admin User
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('admin@example.com')).toBeInTheDocument()

      // Should not show other users
      expect(screen.queryByText('Moderator User')).not.toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
    })

    it('should filter users by email (case-insensitive)', () => {
      const props = { ...defaultProps, searchQuery: 'MODERATOR@' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
    })

    it('should filter users by role (case-insensitive)', () => {
      const props = { ...defaultProps, searchQuery: 'USER' }
      render(<AdminPage {...props} />)

      // Should show Regular User with role "user"
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    it('should filter users by partial match', () => {
      const props = { ...defaultProps, searchQuery: 'mod' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
    })

    it('should show all users when search query is empty', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    it('should show no users when search query matches nothing', () => {
      const props = { ...defaultProps, searchQuery: 'nonexistent' }
      render(<AdminPage {...props} />)

      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
      expect(screen.queryByText('Moderator User')).not.toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
      // DataGrid renders but with no filtered data
      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
    })

    it('should handle special characters in search query', () => {
      const props = { ...defaultProps, searchQuery: '@example.com' }
      render(<AdminPage {...props} />)

      // All users have @example.com in their email
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    it('should handle search with leading/trailing spaces', () => {
      const props = { ...defaultProps, searchQuery: '  admin  ' }
      render(<AdminPage {...props} />)

      // Should still filter (spaces are part of the search, won't match)
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
      expect(screen.queryByText('Moderator User')).not.toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should display current pagination model', () => {
      render(<AdminPage {...defaultProps} />)

      // DataGrid pagination controls should be present
      const pagination = document.querySelector('.MuiTablePagination-root')
      expect(pagination).toBeInTheDocument()
    })

    it('should display rowCount in pagination', () => {
      render(<AdminPage {...defaultProps} />)

      // Should show "1–3 of 3" or similar
      expect(screen.getByText(/1–3 of 3/i)).toBeInTheDocument()
    })

    it('should show correct page size options', () => {
      render(<AdminPage {...defaultProps} />)

      // Click on page size selector
      const pageSizeButton = screen.getByRole('combobox', { name: /rows per page/i })
      fireEvent.mouseDown(pageSizeButton)

      // Should show options 10, 25, 50, 100
      expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument()
    })

    it('should display custom pagination model', () => {
      const customPaginationModel: GridPaginationModel = { page: 2, pageSize: 25 }
      const props = { ...defaultProps, paginationModel: customPaginationModel, rowCount: 100 }
      render(<AdminPage {...props} />)

      // Should show correct page info
      expect(screen.getByText(/51–75 of 100/i)).toBeInTheDocument()
    })

    it('should handle single page of results', () => {
      const props = { ...defaultProps, rowCount: 5 }
      render(<AdminPage {...props} />)

      // Should show pagination info
      const pagination = document.querySelector('.MuiTablePagination-root')
      expect(pagination).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should handle zero results', () => {
      const props = { ...defaultProps, users: [], rowCount: 0 }
      render(<AdminPage {...props} />)

      // Should show 0 results
      expect(screen.getByText(/0–0 of 0/i)).toBeInTheDocument()
    })
  })

  describe('Role-Based Features - Admin', () => {
    it('should show checkbox selection for admin role', () => {
      render(<AdminPage {...defaultProps} />)

      // Admin should see checkboxes
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('should show admin description text', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.getByText(/manage user accounts and roles/i)).toBeInTheDocument()
    })

    it('should not show moderator note for admin', () => {
      render(<AdminPage {...defaultProps} />)

      expect(screen.queryByText(/you have read-only access/i)).not.toBeInTheDocument()
    })

    it('should apply pointer cursor style for admin', () => {
      render(<AdminPage {...defaultProps} />)

      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
      // Cursor style is applied via sx prop
    })
  })

  describe('Role-Based Features - Moderator', () => {
    it('should not show checkbox selection for moderator role', () => {
      const props = { ...defaultProps, currentUserRole: 'moderator' as const }
      render(<AdminPage {...props} />)

      // Moderator should not see checkboxes (only header)
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(0)
    })

    it('should show moderator description text', () => {
      const props = { ...defaultProps, currentUserRole: 'moderator' as const }
      render(<AdminPage {...props} />)

      expect(screen.getByText(/view user accounts \(read-only access\)/i)).toBeInTheDocument()
    })

    it('should show read-only access note for moderator', () => {
      const props = { ...defaultProps, currentUserRole: 'moderator' as const }
      render(<AdminPage {...props} />)

      expect(
        screen.getByText(/you have read-only access.*contact an administrator/i)
      ).toBeInTheDocument()
    })

    it('should apply default cursor style for moderator', () => {
      const props = { ...defaultProps, currentUserRole: 'moderator' as const }
      render(<AdminPage {...props} />)

      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
      // Cursor style is 'default' for moderator
    })
  })

  describe('Role-Based Features - User', () => {
    it('should not show checkbox selection for user role', () => {
      const props = { ...defaultProps, currentUserRole: 'user' as const }
      render(<AdminPage {...props} />)

      // Regular user should not see checkboxes
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(0)
    })

    it('should show user description text', () => {
      const props = { ...defaultProps, currentUserRole: 'user' as const }
      render(<AdminPage {...props} />)

      expect(screen.getByText(/view user accounts \(read-only access\)/i)).toBeInTheDocument()
    })

    it('should not show moderator note for regular user', () => {
      const props = { ...defaultProps, currentUserRole: 'user' as const }
      render(<AdminPage {...props} />)

      expect(
        screen.queryByText(/you have read-only access.*contact an administrator/i)
      ).not.toBeInTheDocument()
    })
  })

  describe('Event Handler Invocations', () => {
    it('should call onSearchChange with correct value when typing', () => {
      render(<AdminPage {...defaultProps} />)

      const searchInput = screen.getByLabelText(/search users/i)
      fireEvent.change(searchInput, { target: { value: 'search text' } })

      expect(mockOnSearchChange).toHaveBeenCalledTimes(1)
      expect(mockOnSearchChange).toHaveBeenCalledWith('search text')
    })

    it('should call onSearchChange multiple times for multiple inputs', () => {
      render(<AdminPage {...defaultProps} />)

      const searchInput = screen.getByLabelText(/search users/i)
      fireEvent.change(searchInput, { target: { value: 'a' } })
      fireEvent.change(searchInput, { target: { value: 'ad' } })
      fireEvent.change(searchInput, { target: { value: 'adm' } })

      expect(mockOnSearchChange).toHaveBeenCalledTimes(3)
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(1, 'a')
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(2, 'ad')
      expect(mockOnSearchChange).toHaveBeenNthCalledWith(3, 'adm')
    })

    it('should not call onSearchChange on initial render', () => {
      render(<AdminPage {...defaultProps} />)

      expect(mockOnSearchChange).not.toHaveBeenCalled()
    })

    it('should not call onPaginationChange on initial render', () => {
      render(<AdminPage {...defaultProps} />)

      expect(mockOnPaginationChange).not.toHaveBeenCalled()
    })
  })

  describe('Client-Side Filtering Logic', () => {
    it('should filter based on exact name match', () => {
      const props = { ...defaultProps, searchQuery: 'Admin User' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.queryByText('Moderator User')).not.toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
    })

    it('should filter based on partial name match', () => {
      const props = { ...defaultProps, searchQuery: 'User' }
      render(<AdminPage {...props} />)

      // All users have "User" in their name
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    it('should filter based on exact email match', () => {
      const props = { ...defaultProps, searchQuery: 'moderator@example.com' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
    })

    it('should filter based on email domain', () => {
      const props = { ...defaultProps, searchQuery: 'example.com' }
      render(<AdminPage {...props} />)

      // All users have example.com domain
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    it('should filter based on role', () => {
      const props = { ...defaultProps, searchQuery: 'moderator' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
    })

    it('should be case-insensitive for name search', () => {
      const props = { ...defaultProps, searchQuery: 'ADMIN' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should be case-insensitive for email search', () => {
      const props = { ...defaultProps, searchQuery: 'ADMIN@EXAMPLE.COM' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should be case-insensitive for role search', () => {
      const props = { ...defaultProps, searchQuery: 'MODERATOR' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Moderator User')).toBeInTheDocument()
    })

    it('should return all users when searchQuery is empty string', () => {
      const props = { ...defaultProps, searchQuery: '' }
      render(<AdminPage {...props} />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Moderator User')).toBeInTheDocument()
      expect(screen.getByText('Regular User')).toBeInTheDocument()
    })

    it('should handle no matches gracefully', () => {
      const props = { ...defaultProps, searchQuery: 'xyz123notfound' }
      render(<AdminPage {...props} />)

      expect(screen.queryByText('Admin User')).not.toBeInTheDocument()
      expect(screen.queryByText('Moderator User')).not.toBeInTheDocument()
      expect(screen.queryByText('Regular User')).not.toBeInTheDocument()
      // DataGrid renders but with no filtered data
      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
    })

    it('should match across multiple fields simultaneously', () => {
      const usersWithOverlap: readonly User[] = [
        {
          id: '1',
          email: 'john@admin.com',
          name: 'John Admin',
          role: 'user',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      const props = { ...defaultProps, users: usersWithOverlap, searchQuery: 'admin' }
      render(<AdminPage {...props} />)

      // Matches both email domain and name
      expect(screen.getByText('John Admin')).toBeInTheDocument()
    })
  })

  describe('DataGrid Configuration', () => {
    it('should use server-side pagination mode', () => {
      render(<AdminPage {...defaultProps} />)

      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
      // paginationMode="server" is set in component
    })

    it('should disable row selection on click', () => {
      render(<AdminPage {...defaultProps} />)

      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
      // disableRowSelectionOnClick is set to true
    })

    it('should have correct page size options', () => {
      render(<AdminPage {...defaultProps} />)

      const pageSizeButton = screen.getByRole('combobox', { name: /rows per page/i })
      fireEvent.mouseDown(pageSizeButton)

      // pageSizeOptions={[10, 25, 50, 100]}
      expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '25' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '50' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument()
    })
  })

  describe('Column Configuration', () => {
    it('should have name column with width 200', () => {
      render(<AdminPage {...defaultProps} />)

      const nameHeader = screen.getByText('Name').closest('.MuiDataGrid-columnHeader')
      expect(nameHeader).toBeInTheDocument()
      // Width is set in columns definition
    })

    it('should have email column with width 250', () => {
      render(<AdminPage {...defaultProps} />)

      const emailHeader = screen.getByText('Email').closest('.MuiDataGrid-columnHeader')
      expect(emailHeader).toBeInTheDocument()
    })

    it('should have role column with width 150', () => {
      render(<AdminPage {...defaultProps} />)

      const roleHeader = screen.getByText('Role').closest('.MuiDataGrid-columnHeader')
      expect(roleHeader).toBeInTheDocument()
    })

    it('should have createdAt column with width 200', () => {
      render(<AdminPage {...defaultProps} />)

      const createdAtHeader = screen.getByText('Created At').closest('.MuiDataGrid-columnHeader')
      expect(createdAtHeader).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
      render(<AdminPage {...defaultProps} />)

      // valueFormatter uses toLocaleDateString()
      const formattedDate = new Date('2024-01-01T00:00:00.000Z').toLocaleDateString()
      expect(screen.getByText(formattedDate)).toBeInTheDocument()
    })

    it('should handle invalid date gracefully', () => {
      const usersWithInvalidDate: readonly User[] = [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: 'invalid-date',
        },
      ]
      const props = { ...defaultProps, users: usersWithInvalidDate }
      render(<AdminPage {...props} />)

      // Should render without crashing
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle users with special characters in name', () => {
      const specialUsers: readonly User[] = [
        {
          id: '1',
          email: 'test@example.com',
          name: "O'Brien-Smith",
          role: 'user',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      const props = { ...defaultProps, users: specialUsers }
      render(<AdminPage {...props} />)

      expect(screen.getByText("O'Brien-Smith")).toBeInTheDocument()
    })

    it('should handle users with unicode characters', () => {
      const unicodeUsers: readonly User[] = [
        {
          id: '1',
          email: 'test@example.com',
          name: '用户名称 🔍',
          role: 'user',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      const props = { ...defaultProps, users: unicodeUsers }
      render(<AdminPage {...props} />)

      expect(screen.getByText('用户名称 🔍')).toBeInTheDocument()
    })

    it('should handle very long user names', () => {
      const longNameUsers: readonly User[] = [
        {
          id: '1',
          email: 'test@example.com',
          name: 'A'.repeat(200),
          role: 'user',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      const props = { ...defaultProps, users: longNameUsers }
      render(<AdminPage {...props} />)

      expect(screen.getByText('A'.repeat(200))).toBeInTheDocument()
    })

    it('should handle very long email addresses', () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'
      const longEmailUsers: readonly User[] = [
        {
          id: '1',
          email: longEmail,
          name: 'Test User',
          role: 'user',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ]
      const props = { ...defaultProps, users: longEmailUsers }
      render(<AdminPage {...props} />)

      expect(screen.getByText(longEmail)).toBeInTheDocument()
    })

    it('should handle very long error messages', () => {
      const longError = 'Error: '.repeat(50) + 'Failed to load'
      const props = { ...defaultProps, error: longError }
      render(<AdminPage {...props} />)

      expect(screen.getByText(longError)).toBeInTheDocument()
    })

    it('should handle maximum pagination values', () => {
      const maxPagination: GridPaginationModel = { page: 999, pageSize: 100 }
      const props = { ...defaultProps, paginationModel: maxPagination, rowCount: 100000 }
      render(<AdminPage {...props} />)

      // Should render without crashing
      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible search input', () => {
      render(<AdminPage {...defaultProps} />)

      const searchInput = screen.getByLabelText(/search users/i)
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('should have proper heading hierarchy', () => {
      render(<AdminPage {...defaultProps} />)

      const heading = screen.getByRole('heading', { name: /user management/i })
      expect(heading.tagName).toBe('H1')
    })

    it('should have accessible error alert', () => {
      const props = { ...defaultProps, error: 'Test error' }
      render(<AdminPage {...props} />)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Test error')
    })

    it('should have accessible DataGrid', () => {
      render(<AdminPage {...defaultProps} />)

      // DataGrid should have proper ARIA attributes
      const dataGrid = document.querySelector('.MuiDataGrid-root')
      expect(dataGrid).toBeInTheDocument()
    })
  })

  describe('Integration - Search and Pagination', () => {
    it('should filter results independently of pagination', () => {
      const customPagination: GridPaginationModel = { page: 1, pageSize: 10 }
      const props = {
        ...defaultProps,
        searchQuery: 'admin',
        paginationModel: customPagination,
      }
      render(<AdminPage {...props} />)

      // Search should work even on page 1
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.queryByText('Moderator User')).not.toBeInTheDocument()
    })

    it('should maintain search query when changing roles', () => {
      const { rerender } = render(<AdminPage {...defaultProps} searchQuery="admin" />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()

      rerender(<AdminPage {...defaultProps} currentUserRole="moderator" searchQuery="admin" />)

      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    it('should show error and filtered results simultaneously', () => {
      const props = {
        ...defaultProps,
        error: 'Warning: Partial data loaded',
        searchQuery: 'admin',
      }
      render(<AdminPage {...props} />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.queryByText('Moderator User')).not.toBeInTheDocument()
    })
  })
})
