import type { User } from '@/domain/user/user.js'

import AdminClient from './AdminClient.js'

interface GetUsersResult {
  users: readonly User[]
  error: string | null
}

async function getUsers(): Promise<GetUsersResult> {
  try {
    const apiUrl = process.env.BACKEND_AI_CALLBACK_URL
    if (!apiUrl) {
      console.warn('BACKEND_AI_CALLBACK_URL not set')
      return {
        users: [],
        error: 'Server configuration error: API URL not set. Please contact support.',
      }
    }

    // eslint-disable-next-line no-console
    console.log('Fetching users from API:', `${apiUrl}/users`)

    // Fetch with a large page size to get all users for client-side pagination
    // In production, consider implementing server-side pagination instead
    const response = await fetch(`${apiUrl}/users?pageSize=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache, always fetch fresh data
    })

    if (!response.ok) {
      console.warn('Failed to fetch users from API')
      return {
        users: [],
        error: `Failed to load users: Server returned ${response.status} ${response.statusText}. Please try refreshing the page.`,
      }
    }

    const responseData = (await response.json()) as {
      success: boolean
      data: Array<{
        userId: string
        email: string
        name: string
        role: string
        createdAt: string
      }>
      pagination?: {
        page: number
        pageSize: number
        total: number
        totalPages: number
      }
    }
    // Map userId to id for MUI DataGrid compatibility
    return {
      users:
        responseData.data?.map((user) => ({
          id: user.userId,
          name: user.name,
          email: user.email,
          role: user.role as 'user' | 'admin' | 'moderator',
          createdAt: user.createdAt,
        })) || [],
      error: null,
    }
    // No finally block needed: agent is request-local, not global
  } catch (error) {
    console.warn('Error fetching users:', error)
    return {
      users: [],
      error:
        'Unable to load users: Network error or server unavailable. Please check your connection and try again.',
    }
  }
}

export default async function AdminPage() {
  const { error, users } = await getUsers()

  return <AdminClient error={error} users={users} />
}
