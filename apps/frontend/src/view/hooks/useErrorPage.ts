import { useRouter, useSearchParams } from 'next/navigation.js'
import { useCallback } from 'react'

interface UseErrorPageProps {
  errorMessage?: string
  errorCode?: string
}

interface UseErrorPageReturn {
  errorMessage: string
  errorCode: string
  handleGoBack: () => void
  handleGoHome: () => void
}

/**
 * Custom hook for error page business logic.
 * Manages error state from URL params and navigation handlers.
 *
 * @param {UseErrorPageProps} props - Hook properties
 * @param {string} [props.errorMessage] - Optional default error message
 * @param {string} [props.errorCode] - Optional default error code
 * @returns {UseErrorPageReturn} Error state and handlers
 *
 * @example
 * ```tsx
 * const { errorMessage, errorCode, handleGoBack, handleGoHome } = useErrorPage()
 * ```
 */
export function useErrorPage(props: UseErrorPageProps = {}): UseErrorPageReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorMessage =
    searchParams.get('message') || props.errorMessage || 'An unexpected error occurred'
  const errorCode = searchParams.get('code') || props.errorCode || '500'

  const handleGoBack = useCallback(() => {
    router.back()
  }, [router])

  const handleGoHome = useCallback(() => {
    router.push('/')
  }, [router])

  return {
    errorCode,
    errorMessage,
    handleGoBack,
    handleGoHome,
  }
}
