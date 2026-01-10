'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchChatByIdAction } from '@/infrastructure/serverActions/fetchChatById.server.js'

const ONE_MINUTE_MS = 60_000

/**
 * React hook that loads a specific chat by its ID.
 *
 * It uses React Query to fetch the chat from the server and keeps the result cached
 * and synchronized. The query is only executed when a non-null `chatId` is provided.
 *
 * @param chatId - The identifier of the chat to be fetched; if `null`,
 *   the query is disabled and no request is made.
 * @returns The full React Query query result object (as returned by `useQuery`), whose
 *   `data` field contains the chat object with messages when the query succeeds.
 */
export function useFetchChat(chatId: string | null) {
  return useQuery({
    queryKey: ['chat', chatId],
    queryFn: async () => {
      if (!chatId) {
        throw new Error('chatId is required to fetch chat')
      }
      const response = await fetchChatByIdAction(chatId)
      return response.data
    },
    enabled: !!chatId, // Only run query if chatId exists
    staleTime: ONE_MINUTE_MS, // 1 minute
  })
}
