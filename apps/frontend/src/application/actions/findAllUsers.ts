import type { PaginatedUsersResponse, User } from '@/domain/user/user.js'

export interface FindAllUsersParams {
  limit: number
  offset: number
}

export interface FindAllUsersResult {
  success: boolean
  users: User[]
  total: number
  error?: string
}

/**
 * Fetch all users with pagination from the API.
 * Maps userId to id for MUI DataGrid compatibility.
 */
export async function findAllUsers(params: FindAllUsersParams): Promise<FindAllUsersResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4321'
    const { limit, offset } = params

    const response = await fetch(`${baseUrl}/api/users?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return {
        success: false,
        users: [],
        total: 0,
        error: `Failed to load users: Server returned ${response.status} ${response.statusText}. Please try refreshing the page.`,
      }
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

    return {
      success: true,
      users: mappedUsers,
      total: data.pagination?.total ?? 0,
    }
  } catch (error) {
    console.warn('Error fetching users:', error)
    return {
      success: false,
      users: [],
      total: 0,
      error:
        'Unable to load users: Network error or server unavailable. Please check your connection and try again.',
    }
  }
}
