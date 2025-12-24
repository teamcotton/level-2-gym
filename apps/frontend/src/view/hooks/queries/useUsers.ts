'use client'

import { useQuery } from '@tanstack/react-query'

import { findAllUsers } from '@/application/actions/findAllUsers.js'
import type { User } from '@/domain/user/user.js'

export interface UseUsersParams {
  limit: number
  offset: number
}

export interface UseUsersResult {
  users: readonly User[]
  total: number
  isLoading: boolean
  isError: boolean
  error: string | null
}

/**
 * TanStack Query hook for fetching paginated users.
 * Provides automatic caching, refetching, and loading/error states.
 *
 * @param params - Pagination parameters (limit, offset)
 * @returns Query result with users, total count, and loading/error states
 */
export function useUsers(params: UseUsersParams): UseUsersResult {
  const { limit, offset } = params

  const query = useQuery({
    queryKey: ['users', { limit, offset }],
    queryFn: async ({ signal }) => {
      const result = await findAllUsers({
        limit,
        offset,
        signal,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch users')
      }

      return {
        users: result.users,
        total: result.total,
      }
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  })

  return {
    users: query.data?.users ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError,
    error: query.error instanceof Error ? query.error.message : null,
  }
}
