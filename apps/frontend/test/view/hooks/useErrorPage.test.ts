import { renderHook } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { useErrorPage } from '@/view/hooks/useErrorPage.js'

// Mock next/navigation
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('useErrorPage', () => {
  const mockPush = vi.fn()
  const mockBack = vi.fn()
  const mockRouter = {
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }

  const mockSearchParams = {
    get: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue(mockRouter)
    ;(useSearchParams as Mock).mockReturnValue(mockSearchParams)
    mockSearchParams.get.mockReturnValue(null)
  })

  describe('Initial State', () => {
    it('should return errorCode, errorMessage, handleGoBack, and handleGoHome', () => {
      const { result } = renderHook(() => useErrorPage())

      expect(result.current).toHaveProperty('errorCode')
      expect(result.current).toHaveProperty('errorMessage')
      expect(result.current).toHaveProperty('handleGoBack')
      expect(result.current).toHaveProperty('handleGoHome')
      expect(typeof result.current.errorCode).toBe('string')
      expect(typeof result.current.errorMessage).toBe('string')
      expect(typeof result.current.handleGoBack).toBe('function')
      expect(typeof result.current.handleGoHome).toBe('function')
    })

    it('should call useRouter hook', () => {
      renderHook(() => useErrorPage())

      expect(useRouter).toHaveBeenCalled()
    })

    it('should call useSearchParams hook', () => {
      renderHook(() => useErrorPage())

      expect(useSearchParams).toHaveBeenCalled()
    })
  })

  describe('Default Error Values', () => {
    it('should return default error code "500" when no params or props provided', () => {
      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('500')
    })

    it('should return default error message when no params or props provided', () => {
      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorMessage).toBe('An unexpected error occurred')
    })

    it('should return default values when searchParams returns null', () => {
      mockSearchParams.get.mockReturnValue(null)

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('500')
      expect(result.current.errorMessage).toBe('An unexpected error occurred')
    })
  })

  describe('Props Override', () => {
    it('should use errorCode from props when provided and no URL param', () => {
      const { result } = renderHook(() => useErrorPage({ errorCode: '404' }))

      expect(result.current.errorCode).toBe('404')
    })

    it('should use errorMessage from props when provided and no URL param', () => {
      const { result } = renderHook(() => useErrorPage({ errorMessage: 'Page not found' }))

      expect(result.current.errorMessage).toBe('Page not found')
    })

    it('should use both errorCode and errorMessage from props', () => {
      const { result } = renderHook(() =>
        useErrorPage({ errorCode: '403', errorMessage: 'Access denied' })
      )

      expect(result.current.errorCode).toBe('403')
      expect(result.current.errorMessage).toBe('Access denied')
    })
  })

  describe('URL Query Parameters', () => {
    it('should use errorCode from query param when provided', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '404'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('404')
    })

    it('should use errorMessage from query param when provided', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'message') return 'Resource not found'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorMessage).toBe('Resource not found')
    })

    it('should use both errorCode and errorMessage from query params', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '403'
        if (key === 'message') return 'Forbidden access'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('403')
      expect(result.current.errorMessage).toBe('Forbidden access')
    })

    it('should call searchParams.get with "code" for error code', () => {
      renderHook(() => useErrorPage())

      expect(mockSearchParams.get).toHaveBeenCalledWith('code')
    })

    it('should call searchParams.get with "message" for error message', () => {
      renderHook(() => useErrorPage())

      expect(mockSearchParams.get).toHaveBeenCalledWith('message')
    })
  })

  describe('Priority: URL Params > Props > Defaults', () => {
    it('should prioritize URL param over props for errorCode', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '500'
        return null
      })

      const { result } = renderHook(() => useErrorPage({ errorCode: '404' }))

      expect(result.current.errorCode).toBe('500')
    })

    it('should prioritize URL param over props for errorMessage', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'message') return 'Server error from URL'
        return null
      })

      const { result } = renderHook(() => useErrorPage({ errorMessage: 'Error from props' }))

      expect(result.current.errorMessage).toBe('Server error from URL')
    })

    it('should prioritize URL params over props over defaults', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '503'
        if (key === 'message') return 'Service unavailable'
        return null
      })

      const { result } = renderHook(() =>
        useErrorPage({ errorCode: '404', errorMessage: 'Not found' })
      )

      expect(result.current.errorCode).toBe('503')
      expect(result.current.errorMessage).toBe('Service unavailable')
    })

    it('should use props when URL params are null', () => {
      mockSearchParams.get.mockReturnValue(null)

      const { result } = renderHook(() =>
        useErrorPage({ errorCode: '401', errorMessage: 'Unauthorized' })
      )

      expect(result.current.errorCode).toBe('401')
      expect(result.current.errorMessage).toBe('Unauthorized')
    })

    it('should use defaults when both URL params and props are not provided', () => {
      mockSearchParams.get.mockReturnValue(null)

      const { result } = renderHook(() => useErrorPage({}))

      expect(result.current.errorCode).toBe('500')
      expect(result.current.errorMessage).toBe('An unexpected error occurred')
    })
  })

  describe('handleGoBack', () => {
    it('should call router.back() when handleGoBack is invoked', () => {
      const { result } = renderHook(() => useErrorPage())

      result.current.handleGoBack()

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('should not call router.push() when handleGoBack is invoked', () => {
      const { result } = renderHook(() => useErrorPage())

      result.current.handleGoBack()

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should allow multiple calls to handleGoBack', () => {
      const { result } = renderHook(() => useErrorPage())

      result.current.handleGoBack()
      result.current.handleGoBack()
      result.current.handleGoBack()

      expect(mockBack).toHaveBeenCalledTimes(3)
    })
  })

  describe('handleGoHome', () => {
    it('should call router.push("/") when handleGoHome is invoked', () => {
      const { result } = renderHook(() => useErrorPage())

      result.current.handleGoHome()

      expect(mockPush).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should not call router.back() when handleGoHome is invoked', () => {
      const { result } = renderHook(() => useErrorPage())

      result.current.handleGoHome()

      expect(mockBack).not.toHaveBeenCalled()
    })

    it('should allow multiple calls to handleGoHome', () => {
      const { result } = renderHook(() => useErrorPage())

      result.current.handleGoHome()
      result.current.handleGoHome()

      expect(mockPush).toHaveBeenCalledTimes(2)
      expect(mockPush).toHaveBeenNthCalledWith(1, '/')
      expect(mockPush).toHaveBeenNthCalledWith(2, '/')
    })
  })

  describe('Different Error Scenarios', () => {
    it('should handle 404 error scenario', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '404'
        if (key === 'message') return 'Page not found'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('404')
      expect(result.current.errorMessage).toBe('Page not found')
    })

    it('should handle 403 error scenario', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '403'
        if (key === 'message') return 'Access forbidden'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('403')
      expect(result.current.errorMessage).toBe('Access forbidden')
    })

    it('should handle 500 error scenario', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '500'
        if (key === 'message') return 'Internal server error'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('500')
      expect(result.current.errorMessage).toBe('Internal server error')
    })

    it('should handle long error messages', () => {
      const longMessage =
        'This is a very long error message that describes a complex error situation with multiple details'

      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'message') return longMessage
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorMessage).toBe(longMessage)
    })

    it('should handle custom error codes from props', () => {
      const { result } = renderHook(() =>
        useErrorPage({ errorCode: 'CUSTOM_ERROR', errorMessage: 'Custom error occurred' })
      )

      expect(result.current.errorCode).toBe('CUSTOM_ERROR')
      expect(result.current.errorMessage).toBe('Custom error occurred')
    })
  })

  describe('Hook Reactivity', () => {
    it('should update values when URL params change', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '404'
        return null
      })

      const { rerender, result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('404')

      // Simulate URL change
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '500'
        return null
      })

      rerender()

      expect(result.current.errorCode).toBe('500')
    })
  })

  describe('Memoization', () => {
    it('should maintain referential equality for handleGoBack across re-renders', () => {
      const { rerender, result } = renderHook(() => useErrorPage())

      const firstHandleGoBack = result.current.handleGoBack

      rerender()

      expect(result.current.handleGoBack).toBe(firstHandleGoBack)
    })

    it('should maintain referential equality for handleGoHome across re-renders', () => {
      const { rerender, result } = renderHook(() => useErrorPage())

      const firstHandleGoHome = result.current.handleGoHome

      rerender()

      expect(result.current.handleGoHome).toBe(firstHandleGoHome)
    })

    it('should maintain referential equality for both handlers across multiple re-renders', () => {
      const { rerender, result } = renderHook(() => useErrorPage())

      const firstHandleGoBack = result.current.handleGoBack
      const firstHandleGoHome = result.current.handleGoHome

      rerender()
      rerender()
      rerender()

      expect(result.current.handleGoBack).toBe(firstHandleGoBack)
      expect(result.current.handleGoHome).toBe(firstHandleGoHome)
    })

    it('should maintain handler identity when props change but router does not', () => {
      const { rerender, result } = renderHook(
        ({ errorCode }: { errorCode?: string }) => useErrorPage({ errorCode }),
        { initialProps: { errorCode: '404' } }
      )

      const firstHandleGoBack = result.current.handleGoBack
      const firstHandleGoHome = result.current.handleGoHome

      rerender({ errorCode: '500' })

      expect(result.current.handleGoBack).toBe(firstHandleGoBack)
      expect(result.current.handleGoHome).toBe(firstHandleGoHome)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string in URL params', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return ''
        if (key === 'message') return ''
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      // Empty strings are falsy, so defaults should be used
      expect(result.current.errorCode).toBe('500')
      expect(result.current.errorMessage).toBe('An unexpected error occurred')
    })

    it('should handle undefined props', () => {
      const { result } = renderHook(() => useErrorPage(undefined))

      expect(result.current.errorCode).toBe('500')
      expect(result.current.errorMessage).toBe('An unexpected error occurred')
    })

    it('should handle empty object props', () => {
      const { result } = renderHook(() => useErrorPage({}))

      expect(result.current.errorCode).toBe('500')
      expect(result.current.errorMessage).toBe('An unexpected error occurred')
    })

    it('should handle only errorCode in URL params', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'code') return '404'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('404')
      expect(result.current.errorMessage).toBe('An unexpected error occurred')
    })

    it('should handle only errorMessage in URL params', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'message') return 'Something went wrong'
        return null
      })

      const { result } = renderHook(() => useErrorPage())

      expect(result.current.errorCode).toBe('500')
      expect(result.current.errorMessage).toBe('Something went wrong')
    })
  })
})
