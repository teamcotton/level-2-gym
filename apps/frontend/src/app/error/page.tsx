'use client'

import { ErrorPageDisplay } from '@/view/client-components/ErrorPageDisplay.js'
import { useErrorPage } from '@/view/hooks/useErrorPage.js'

/**
 * Error page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 *
 * @example
 * // Access with default error
 * /error
 *
 * // Access with custom error code and message
 * /error?code=404&message=Page not found
 */
export default function ErrorPage() {
  const { errorCode, errorMessage, handleGoBack, handleGoHome } = useErrorPage()

  return (
    <ErrorPageDisplay
      errorCode={errorCode}
      errorMessage={errorMessage}
      onGoBack={handleGoBack}
      onGoHome={handleGoHome}
    />
  )
}
