export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin' | 'moderator'
  createdAt: string
}

/**
 * Backend API user response format (matches backend controller output)
 */
export interface UserApiResponse {
  userId: string
  email: string
  name: string
  role: string
  createdAt: string
}

/**
 * Paginated response structure from backend API
 */
export interface PaginatedUsersResponse {
  success: boolean
  data: UserApiResponse[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}
