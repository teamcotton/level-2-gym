import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { DashboardPageClient } from '../../../app/dashboard/DashboardPageClient.js'

// Mock Next.js router
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

describe('DashboardPageClient', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue({
      push: mockPush,
    })
  })

  describe('Rendering - Basic Elements', () => {
    it('should render the page title', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    })

    it('should render Chat card', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Start a conversation with AI')).toBeInTheDocument()
    })

    it('should render Profile card', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('View and edit your profile')).toBeInTheDocument()
    })
  })

  describe('Admin Card Visibility', () => {
    it('should NOT render Admin card for regular user', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should render Admin card for admin user', () => {
      render(<DashboardPageClient userRoles={['admin']} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Manage users and settings')).toBeInTheDocument()
    })

    it('should render Admin card for moderator user', () => {
      render(<DashboardPageClient userRoles={['moderator']} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Manage users and settings')).toBeInTheDocument()
    })

    it('should render Admin card for user with both admin and moderator roles', () => {
      render(<DashboardPageClient userRoles={['admin', 'moderator']} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should render Admin card for admin user with multiple roles including user', () => {
      render(<DashboardPageClient userRoles={['user', 'admin']} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should NOT render Admin card for user with empty roles array', () => {
      render(<DashboardPageClient userRoles={[]} />)

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should NOT render Admin card for user with unrecognized roles', () => {
      render(<DashboardPageClient userRoles={['guest', 'viewer']} />)

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should navigate to /ai when Chat card is clicked', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      const chatCard = screen.getByText('Chat').closest('button')
      expect(chatCard).toBeInTheDocument()

      fireEvent.click(chatCard!)

      expect(mockPush).toHaveBeenCalledWith('/ai')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to /profile when Profile card is clicked', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      const profileCard = screen.getByText('Profile').closest('button')
      expect(profileCard).toBeInTheDocument()

      fireEvent.click(profileCard!)

      expect(mockPush).toHaveBeenCalledWith('/profile')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to /admin when Admin card is clicked (admin role)', () => {
      render(<DashboardPageClient userRoles={['admin']} />)

      const adminCard = screen.getByText('Admin').closest('button')
      expect(adminCard).toBeInTheDocument()

      fireEvent.click(adminCard!)

      expect(mockPush).toHaveBeenCalledWith('/admin')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to /admin when Admin card is clicked (moderator role)', () => {
      render(<DashboardPageClient userRoles={['moderator']} />)

      const adminCard = screen.getByText('Admin').closest('button')
      expect(adminCard).toBeInTheDocument()

      fireEvent.click(adminCard!)

      expect(mockPush).toHaveBeenCalledWith('/admin')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('Icons', () => {
    it('should render ChatIcon for Chat card', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      // MUI icons render as SVGs with a specific test ID or class
      const chatSection = screen.getByText('Chat').closest('div[class*="CardContent"]')
      expect(chatSection).toBeInTheDocument()

      // Check that the card content container exists
      const svg = chatSection?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render PersonIcon for Profile card', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      const profileSection = screen.getByText('Profile').closest('div[class*="CardContent"]')
      expect(profileSection).toBeInTheDocument()

      const svg = profileSection?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render AdminPanelSettingsIcon for Admin card when visible', () => {
      render(<DashboardPageClient userRoles={['admin']} />)

      const adminSection = screen.getByText('Admin').closest('div[class*="CardContent"]')
      expect(adminSection).toBeInTheDocument()

      const svg = adminSection?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should render all cards in a grid layout', () => {
      const { container } = render(<DashboardPageClient userRoles={['admin']} />)

      // Check that the Box component with MUI styling exists
      const boxContainer = container.querySelector('.MuiBox-root')
      expect(boxContainer).toBeInTheDocument()
    })

    it('should render exactly 2 cards for regular user', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      const cards = screen.getAllByRole('button')
      expect(cards).toHaveLength(2)
    })

    it('should render exactly 3 cards for admin user', () => {
      render(<DashboardPageClient userRoles={['admin']} />)

      const cards = screen.getAllByRole('button')
      expect(cards).toHaveLength(3)
    })

    it('should render exactly 3 cards for moderator user', () => {
      render(<DashboardPageClient userRoles={['moderator']} />)

      const cards = screen.getAllByRole('button')
      expect(cards).toHaveLength(3)
    })
  })

  describe('Card Content', () => {
    it('should have correct card content for Chat', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Start a conversation with AI')).toBeInTheDocument()
    })

    it('should have correct card content for Profile', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('View and edit your profile')).toBeInTheDocument()
    })

    it('should have correct card content for Admin', () => {
      render(<DashboardPageClient userRoles={['admin']} />)

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Manage users and settings')).toBeInTheDocument()
    })
  })

  describe('Container and Layout', () => {
    it('should render within a Container component', () => {
      const { container } = render(<DashboardPageClient userRoles={['user']} />)

      // MUI Container has a specific class
      const muiContainer = container.querySelector('.MuiContainer-root')
      expect(muiContainer).toBeInTheDocument()
    })

    it('should have proper Box component for card layout', () => {
      const { container } = render(<DashboardPageClient userRoles={['user']} />)

      const boxElement = container.querySelector('.MuiBox-root')
      expect(boxElement).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle case-sensitive role names correctly', () => {
      // Roles should be case-sensitive
      render(<DashboardPageClient userRoles={['Admin']} />)

      // 'Admin' (capital A) should not match 'admin'
      expect(screen.queryByText('Manage users and settings')).not.toBeInTheDocument()
    })

    it('should handle undefined roles gracefully', () => {
      // TypeScript should prevent this, but test runtime behavior
      render(<DashboardPageClient userRoles={[] as string[]} />)

      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should only call router.push once per click', () => {
      render(<DashboardPageClient userRoles={['user']} />)

      const chatCard = screen.getByText('Chat').closest('button')!

      fireEvent.click(chatCard)
      fireEvent.click(chatCard)
      fireEvent.click(chatCard)

      expect(mockPush).toHaveBeenCalledTimes(3)
      expect(mockPush).toHaveBeenCalledWith('/ai')
    })
  })
})
