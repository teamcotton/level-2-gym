import type { PaginatedUsersResponse, User } from '@/domain/user/user.js'
import { UnifiedLogger } from '@/infrastructure/logging/logger.js'

export interface FindAllUsersParams {
  limit: number
  offset: number
  signal?: AbortSignal
}

export interface FindAllUsersResult {
  success: boolean
  users: readonly User[]
  total: number
  error?: string
  status: number
}

const logger = new UnifiedLogger({ prefix: '[find-all-users]' })

/**
 * Fetch all users with pagination from the API.
 * Maps userId to id for MUI DataGrid compatibility.
 */
export async function findAllUsers(params: FindAllUsersParams): Promise<FindAllUsersResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:4321'
    const { limit, offset, signal } = params

    const response = await fetch(`${baseUrl}/api/users?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal,
    })

    if (response.status === 404) {
      return {
        status: response.status,
        success: false,
        users: [],
        total: 0,
        error: `Failed to find users: Server returned ${response.status} ${response.statusText}. Please check your API URL in the .env file.`,
      }
    }

    if (!response.ok) {
      return {
        status: response.status,
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
      status: response.status,
      success: true,
      users: mappedUsers,
      total: data.pagination?.total ?? 0,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    logger.warn('Error fetching users:', error)
    return {
      status: 500,
      success: false,
      users: [],
      total: 0,
      error:
        'Unable to load users: Network error or server unavailable. Please check your connection and try again.',
    }
  }
}
