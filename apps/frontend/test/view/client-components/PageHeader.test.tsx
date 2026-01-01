import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PageHeader } from '@/view/client-components/PageHeader.js'

describe('PageHeader Component', () => {
  const mockOnNavigateHome = vi.fn()
  const mockOnSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core Rendering', () => {
    it('should render the page title', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const title = screen.getByRole('heading', { name: /dashboard/i, level: 1 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Dashboard')
    })

    it('should render custom title passed as prop', () => {
      render(
        <PageHeader
          title="Admin Panel"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const title = screen.getByRole('heading', { name: /admin panel/i, level: 1 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Admin Panel')
    })

    it('should render the home icon button', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const homeButton = screen.getByRole('button', { name: /home/i })
      expect(homeButton).toBeInTheDocument()
      expect(screen.getByTestId('HomeIcon')).toBeInTheDocument()
    })

    it('should render the sign out button', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toBeInTheDocument()
      expect(screen.getByTestId('LogoutIcon')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onNavigateHome when home icon is clicked', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const homeButton = screen.getByRole('button', { name: /home/i })
      fireEvent.click(homeButton)

      expect(mockOnNavigateHome).toHaveBeenCalledTimes(1)
      expect(mockOnSignOut).not.toHaveBeenCalled()
    })

    it('should call onSignOut when sign out button is clicked', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      expect(mockOnSignOut).toHaveBeenCalledTimes(1)
      expect(mockOnNavigateHome).not.toHaveBeenCalled()
    })

    it('should handle multiple clicks on home button', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const homeButton = screen.getByRole('button', { name: /home/i })
      fireEvent.click(homeButton)
      fireEvent.click(homeButton)
      fireEvent.click(homeButton)

      expect(mockOnNavigateHome).toHaveBeenCalledTimes(3)
    })

    it('should handle multiple clicks on sign out button', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)
      fireEvent.click(signOutButton)

      expect(mockOnSignOut).toHaveBeenCalledTimes(2)
    })
  })

  describe('Layout and Styling', () => {
    it('should render with proper MUI Box structure', () => {
      const { container } = render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const boxes = container.querySelectorAll('.MuiBox-root')
      expect(boxes.length).toBeGreaterThan(0)
    })

    it('should render home icon button with large size', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const homeButton = screen.getByRole('button', { name: /home/i })
      expect(homeButton).toHaveClass('MuiIconButton-sizeLarge')
    })

    it('should render sign out button with outlined variant', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      expect(signOutButton).toHaveClass('MuiButton-outlined')
    })

    it('should render title as h1 heading', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveClass('MuiTypography-h3')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label on home button', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const homeButton = screen.getByLabelText('Home')
      expect(homeButton).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2) // Home button and Sign Out button
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty title string', () => {
      render(<PageHeader title="" onNavigateHome={mockOnNavigateHome} onSignOut={mockOnSignOut} />)

      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('')
    })

    it('should handle very long title', () => {
      const longTitle =
        'This is a very long title that might cause layout issues if not handled properly'
      render(
        <PageHeader
          title={longTitle}
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent(longTitle)
    })

    it('should handle title with special characters', () => {
      const specialTitle = 'Dashboard & Analytics @ 2026'
      render(
        <PageHeader
          title={specialTitle}
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toHaveTextContent(specialTitle)
    })
  })

  describe('Component Isolation', () => {
    it('should not affect global state', () => {
      const { unmount } = render(
        <PageHeader
          title="Dashboard"
          onNavigateHome={mockOnNavigateHome}
          onSignOut={mockOnSignOut}
        />
      )

      expect(mockOnNavigateHome).not.toHaveBeenCalled()
      expect(mockOnSignOut).not.toHaveBeenCalled()

      unmount()

      expect(mockOnNavigateHome).not.toHaveBeenCalled()
      expect(mockOnSignOut).not.toHaveBeenCalled()
    })

    it('should render independently with different props', () => {
      const { rerender } = render(
        <PageHeader title="Page 1" onNavigateHome={mockOnNavigateHome} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Page 1')).toBeInTheDocument()

      rerender(
        <PageHeader title="Page 2" onNavigateHome={mockOnNavigateHome} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Page 2')).toBeInTheDocument()
      expect(screen.queryByText('Page 1')).not.toBeInTheDocument()
    })
  })
})
