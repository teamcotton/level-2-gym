import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ErrorPage from '../../src/app/error/page.js'

// Mock Next.js navigation
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

describe('ErrorPage', () => {
  const mockPush = vi.fn()
  const mockBack = vi.fn()
  const mockRouter = {
    push: mockPush,
    back: mockBack,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
  })

  describe('Default Error Display', () => {
    beforeEach(() => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue(null),
      } as any)
    })

    it('should render default error code 500', () => {
      render(<ErrorPage />)
      expect(screen.getByRole('heading', { name: '500', level: 1 })).toBeInTheDocument()
    })

    it('should render default error message', () => {
      render(<ErrorPage />)
      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })

    it('should render error heading', () => {
      render(<ErrorPage />)
      expect(
        screen.getByRole('heading', { name: /Oops! Something went wrong/i })
      ).toBeInTheDocument()
    })

    it('should render support message', () => {
      render(<ErrorPage />)
      expect(
        screen.getByText(/If this problem persists, please contact support/i)
      ).toBeInTheDocument()
    })
  })

  describe('Custom Error Display', () => {
    it('should render custom error code from query params', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'code' ? '404' : null)),
      } as any)

      render(<ErrorPage />)
      expect(screen.getByRole('heading', { name: '404', level: 1 })).toBeInTheDocument()
    })

    it('should render custom error message from query params', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'message' ? 'Page not found' : null)),
      } as any)

      render(<ErrorPage />)
      expect(screen.getByText('Page not found')).toBeInTheDocument()
    })

    it('should render both custom code and message', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => {
          if (key === 'code') return '403'
          if (key === 'message') return 'Access denied'
          return null
        }),
      } as any)

      render(<ErrorPage />)
      expect(screen.getByRole('heading', { name: '403', level: 1 })).toBeInTheDocument()
      expect(screen.getByText('Access denied')).toBeInTheDocument()
    })
  })

  describe('Navigation Buttons', () => {
    beforeEach(() => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue(null),
      } as any)
    })

    it('should render Go Back button', () => {
      render(<ErrorPage />)
      expect(screen.getByRole('button', { name: /Go Back/i })).toBeInTheDocument()
    })

    it('should render Go Home button', () => {
      render(<ErrorPage />)
      expect(screen.getByRole('button', { name: /Go Home/i })).toBeInTheDocument()
    })

    it('should call router.back() when Go Back button is clicked', async () => {
      render(<ErrorPage />)
      const backButton = screen.getByRole('button', { name: /Go Back/i })

      fireEvent.click(backButton)

      expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('should call router.push("/") when Go Home button is clicked', async () => {
      render(<ErrorPage />)
      const homeButton = screen.getByRole('button', { name: /Go Home/i })

      fireEvent.click(homeButton)

      expect(mockPush).toHaveBeenCalledWith('/')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('UI Elements', () => {
    beforeEach(() => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue(null),
      } as any)
    })

    it('should render error icon', () => {
      const { container: _container } = render(<ErrorPage />)
      const icon = _container.querySelector('svg[data-testid="ErrorOutlineIcon"]')
      expect(icon).toBeInTheDocument()
    })

    it('should render home icon in button', () => {
      render(<ErrorPage />)
      const homeButton = screen.getByRole('button', { name: /Go Home/i })
      const icon = homeButton.querySelector('svg[data-testid="HomeIcon"]')
      expect(icon).toBeInTheDocument()
    })

    it('should render back arrow icon in button', () => {
      render(<ErrorPage />)
      const backButton = screen.getByRole('button', { name: /Go Back/i })
      const icon = backButton.querySelector('svg[data-testid="ArrowBackIcon"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn().mockReturnValue(null),
      } as any)
    })

    it('should have proper heading hierarchy', () => {
      render(<ErrorPage />)
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
    })

    it('should have accessible buttons with proper labels', () => {
      render(<ErrorPage />)
      const backButton = screen.getByRole('button', { name: /Go Back/i })
      const homeButton = screen.getByRole('button', { name: /Go Home/i })
      expect(backButton).toBeEnabled()
      expect(homeButton).toBeEnabled()
    })
  })
})
