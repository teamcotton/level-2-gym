'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * React Query provider component that wraps the application with QueryClient
 *
 * Provides React Query functionality throughout the app with preconfigured defaults
 * for caching, refetching, and retry behavior. Includes React Query DevTools in development.
 *
 * @name QueryProvider
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with QueryClientProvider
 *
 * @description
 * Configuration:
 * - **Queries**: 1-minute stale time, 5-minute garbage collection, auto-refetch on window focus, 3 retries
 * - **Mutations**: 1 retry attempt
 * - **DevTools**: Available in development mode only (closed by default)
 *
 * This component uses `useState` to ensure a single QueryClient instance per component mount,
 * preventing client/server state mismatches in Next.js App Router.
 *
 * @example
 * ```tsx
 * // In root layout
 * import { QueryProvider } from './providers/QueryProvider'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <QueryProvider>
 *           {children}
 *         </QueryProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Using in a component
 * import { useQuery } from '@tanstack/react-query'
 *
 * function UserList() {
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['users'],
 *     queryFn: fetchUsers
 *   })
 *   // Component logic...
 * }
 * ```
 *
 * @see {@link https://tanstack.com/query/latest/docs/react/overview|TanStack Query Documentation}
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            retry: 3,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
