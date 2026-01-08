'use client'

import { useQuery } from '@tanstack/react-query'

import { getChatsByUserIdAction } from '@/infrastructure/serverActions/getChatsByUserId.server.js'

const ONE_MINUTE_MS = 60_000

/**
 * React hook that loads the list of chat IDs associated with a given user.
 *
 * It uses React Query to fetch chats from the server and keeps the result cached
 * and synchronized. The query is only executed when a non-null `userId` is provided.
 *
 * @param userId - The identifier of the user whose chats should be fetched; if `null`,
 *   the query is disabled and no request is made.
 * @returns The full React Query query result object (as returned by `useQuery`), whose
 *   `data` field contains an array of chat IDs for the user when the query succeeds.
 */
export function useUserChats(userId: string | null) {
  return useQuery({
    queryKey: ['user-chats', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('userId is required to fetch user chats')
      }
      const response = await getChatsByUserIdAction(userId)
      return response.data
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: ONE_MINUTE_MS, // 1 minute
  })
}
