import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Dashboard } from '@/view/client-components/Dashboard.js'

describe('Dashboard', () => {
  const mockOnNavigate = vi.fn()
  const mockOnSignOut = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering - Basic Elements', () => {
    it('should render the page title', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument()
    })

    it('should render Chat card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Start a conversation with AI')).toBeInTheDocument()
    })

    it('should render Profile card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('View and edit your profile')).toBeInTheDocument()
    })
  })

  describe('Admin Card Visibility', () => {
    it('should NOT render Admin card when canAccessAdmin is false', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should render Admin card when canAccessAdmin is true', () => {
      render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Manage users and settings')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should call onNavigate with /ai when Chat card is clicked', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const chatCard = screen.getByText('Chat').closest('button')
      expect(chatCard).toBeInTheDocument()

      fireEvent.click(chatCard!)

      expect(mockOnNavigate).toHaveBeenCalledWith('/ai')
      expect(mockOnNavigate).toHaveBeenCalledTimes(1)
    })

    it('should call onNavigate with /profile when Profile card is clicked', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const profileCard = screen.getByText('Profile').closest('button')
      expect(profileCard).toBeInTheDocument()

      fireEvent.click(profileCard!)

      expect(mockOnNavigate).toHaveBeenCalledWith('/profile')
      expect(mockOnNavigate).toHaveBeenCalledTimes(1)
    })

    it('should call onNavigate with /admin when Admin card is clicked', () => {
      render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const adminCard = screen.getByText('Admin').closest('button')
      expect(adminCard).toBeInTheDocument()

      fireEvent.click(adminCard!)

      expect(mockOnNavigate).toHaveBeenCalledWith('/admin')
      expect(mockOnNavigate).toHaveBeenCalledTimes(1)
    })
  })

  describe('Icons', () => {
    it('should render ChatIcon for Chat card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      // MUI icons render as SVGs with a specific test ID or class
      const chatSection = screen.getByText('Chat').closest('div[class*="CardContent"]')
      expect(chatSection).toBeInTheDocument()

      // Check that the card content container exists
      const svg = chatSection?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render PersonIcon for Profile card', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const profileSection = screen.getByText('Profile').closest('div[class*="CardContent"]')
      expect(profileSection).toBeInTheDocument()

      const svg = profileSection?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should render AdminPanelSettingsIcon for Admin card when visible', () => {
      render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const adminSection = screen.getByText('Admin').closest('div[class*="CardContent"]')
      expect(adminSection).toBeInTheDocument()

      const svg = adminSection?.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should render all cards in a grid layout', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      // Check that the Box component with MUI styling exists
      const boxContainer = container.querySelector('.MuiBox-root')
      expect(boxContainer).toBeInTheDocument()
    })

    it('should render exactly 2 cards when canAccessAdmin is false', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      // Count cards, not all buttons (Sign Out button and Home button are also present)
      const cards = screen.getAllByRole('button')
      expect(cards).toHaveLength(4) // 2 navigation cards + 1 Sign Out button + 1 Home button
    })

    it('should render exactly 3 cards when canAccessAdmin is true', () => {
      render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      // Count cards, not all buttons (Sign Out button and Home button are also present)
      const cards = screen.getAllByRole('button')
      expect(cards).toHaveLength(5) // 3 navigation cards + 1 Sign Out button + 1 Home button
    })
  })

  describe('Card Content', () => {
    it('should have correct card content for Chat', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Chat')).toBeInTheDocument()
      expect(screen.getByText('Start a conversation with AI')).toBeInTheDocument()
    })

    it('should have correct card content for Profile', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('View and edit your profile')).toBeInTheDocument()
    })

    it('should have correct card content for Admin', () => {
      render(
        <Dashboard canAccessAdmin={true} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('Manage users and settings')).toBeInTheDocument()
    })
  })

  describe('Container and Layout', () => {
    it('should render within a Container component', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      // MUI Container has a specific class
      const muiContainer = container.querySelector('.MuiContainer-root')
      expect(muiContainer).toBeInTheDocument()
    })

    it('should have proper Box component for card layout', () => {
      const { container } = render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const boxElement = container.querySelector('.MuiBox-root')
      expect(boxElement).toBeInTheDocument()
    })
  })

  describe('Callback Functions', () => {
    it('should only call onNavigate once per click', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const chatCard = screen.getByText('Chat').closest('button')!

      fireEvent.click(chatCard)
      fireEvent.click(chatCard)
      fireEvent.click(chatCard)

      expect(mockOnNavigate).toHaveBeenCalledTimes(3)
      expect(mockOnNavigate).toHaveBeenCalledWith('/ai')
    })

    it('should not throw error when onNavigate is called', () => {
      render(
        <Dashboard canAccessAdmin={false} onNavigate={mockOnNavigate} onSignOut={mockOnSignOut} />
      )

      const chatCard = screen.getByText('Chat').closest('button')!

      expect(() => fireEvent.click(chatCard)).not.toThrow()
    })
  })
})
