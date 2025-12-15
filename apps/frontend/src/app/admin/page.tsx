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

    const response = await fetch(`${apiUrl}/users`, {
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

    const data = (await response.json()) as {
      success: boolean
      data: Array<{
        userId: string
        email: string
        name: string
        role: string
        createdAt: string
      }>
    }
    // Map userId to id for MUI DataGrid compatibility
    const users =
      data.data?.map((user) => ({
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role as 'user' | 'admin' | 'moderator',
        createdAt: user.createdAt,
      })) || []

    return { users, error: null }
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
