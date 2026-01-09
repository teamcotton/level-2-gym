import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ErrorPageDisplay } from '@/view/client-components/ErrorPageDisplay.js'

describe('ErrorPageDisplay', () => {
  const mockOnGoBack = vi.fn()
  const mockOnGoHome = vi.fn()

  const defaultProps = {
    errorCode: '500',
    errorMessage: 'An unexpected error occurred',
    onGoBack: mockOnGoBack,
    onGoHome: mockOnGoHome,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the error code', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const errorCodeHeading = screen.getByRole('heading', { level: 1, name: '500' })
      expect(errorCodeHeading).toBeInTheDocument()
    })

    it('should render the error message', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
    })

    it('should render the main heading "Oops! Something went wrong"', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const mainHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Oops! Something went wrong',
      })
      expect(mainHeading).toBeInTheDocument()
    })

    it('should render the support message', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      expect(
        screen.getByText('If this problem persists, please contact support.')
      ).toBeInTheDocument()
    })

    it('should render with custom error code', () => {
      render(<ErrorPageDisplay {...defaultProps} errorCode="404" />)

      const errorCodeHeading = screen.getByRole('heading', { level: 1, name: '404' })
      expect(errorCodeHeading).toBeInTheDocument()
    })

    it('should render with custom error message', () => {
      render(
        <ErrorPageDisplay
          {...defaultProps}
          errorMessage="The page you are looking for does not exist"
        />
      )

      expect(screen.getByText('The page you are looking for does not exist')).toBeInTheDocument()
    })
  })

  describe('Navigation Buttons', () => {
    it('should render Go Back button', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goBackButton = screen.getByRole('button', { name: /go back/i })
      expect(goBackButton).toBeInTheDocument()
    })

    it('should render Go Home button', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goHomeButton = screen.getByRole('button', { name: /go home/i })
      expect(goHomeButton).toBeInTheDocument()
    })

    it('should call onGoBack when Go Back button is clicked', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goBackButton = screen.getByRole('button', { name: /go back/i })
      fireEvent.click(goBackButton)

      expect(mockOnGoBack).toHaveBeenCalledTimes(1)
    })

    it('should call onGoHome when Go Home button is clicked', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goHomeButton = screen.getByRole('button', { name: /go home/i })
      fireEvent.click(goHomeButton)

      expect(mockOnGoHome).toHaveBeenCalledTimes(1)
    })

    it('should not call onGoHome when Go Back button is clicked', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goBackButton = screen.getByRole('button', { name: /go back/i })
      fireEvent.click(goBackButton)

      expect(mockOnGoHome).not.toHaveBeenCalled()
    })

    it('should not call onGoBack when Go Home button is clicked', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goHomeButton = screen.getByRole('button', { name: /go home/i })
      fireEvent.click(goHomeButton)

      expect(mockOnGoBack).not.toHaveBeenCalled()
    })

    it('should allow multiple clicks on Go Back button', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goBackButton = screen.getByRole('button', { name: /go back/i })
      fireEvent.click(goBackButton)
      fireEvent.click(goBackButton)
      fireEvent.click(goBackButton)

      expect(mockOnGoBack).toHaveBeenCalledTimes(3)
    })

    it('should allow multiple clicks on Go Home button', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const goHomeButton = screen.getByRole('button', { name: /go home/i })
      fireEvent.click(goHomeButton)
      fireEvent.click(goHomeButton)

      expect(mockOnGoHome).toHaveBeenCalledTimes(2)
    })
  })

  describe('UI Elements', () => {
    it('should render error icon', () => {
      const { container } = render(<ErrorPageDisplay {...defaultProps} />)

      // ErrorOutlineIcon is rendered as an SVG with specific class
      const errorIcon = container.querySelector('svg[data-testid="ErrorOutlineIcon"]')
      expect(errorIcon).toBeInTheDocument()
    })

    it('should render home icon in Go Home button', () => {
      const { container } = render(<ErrorPageDisplay {...defaultProps} />)

      // HomeIcon is rendered as an SVG with specific class
      const homeIcon = container.querySelector('svg[data-testid="HomeIcon"]')
      expect(homeIcon).toBeInTheDocument()
    })

    it('should render back arrow icon in Go Back button', () => {
      const { container } = render(<ErrorPageDisplay {...defaultProps} />)

      // ArrowBackIcon is rendered as an SVG with specific class
      const arrowIcon = container.querySelector('svg[data-testid="ArrowBackIcon"]')
      expect(arrowIcon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })

      expect(h1).toBeInTheDocument()
      expect(h2).toBeInTheDocument()
    })

    it('should have accessible buttons with proper labels', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)

      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('should render error code as h1 for screen readers', () => {
      render(<ErrorPageDisplay {...defaultProps} errorCode="403" />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('403')
    })

    it('should render main message as h2 for screen readers', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toHaveTextContent('Oops! Something went wrong')
    })
  })

  describe('Different Error Scenarios', () => {
    it('should handle 404 error correctly', () => {
      render(<ErrorPageDisplay {...defaultProps} errorCode="404" errorMessage="Page not found" />)

      expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument()
      expect(screen.getByText('Page not found')).toBeInTheDocument()
    })

    it('should handle 403 error correctly', () => {
      render(<ErrorPageDisplay {...defaultProps} errorCode="403" errorMessage="Access forbidden" />)

      expect(screen.getByRole('heading', { level: 1, name: '403' })).toBeInTheDocument()
      expect(screen.getByText('Access forbidden')).toBeInTheDocument()
    })

    it('should handle 500 error correctly', () => {
      render(
        <ErrorPageDisplay {...defaultProps} errorCode="500" errorMessage="Internal server error" />
      )

      expect(screen.getByRole('heading', { level: 1, name: '500' })).toBeInTheDocument()
      expect(screen.getByText('Internal server error')).toBeInTheDocument()
    })

    it('should handle long error messages', () => {
      const longMessage =
        'This is a very long error message that describes a complex error situation with multiple details and explanations about what went wrong in the application.'

      render(<ErrorPageDisplay {...defaultProps} errorMessage={longMessage} />)

      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it('should handle empty error message gracefully', () => {
      const { container } = render(<ErrorPageDisplay {...defaultProps} errorMessage="" />)

      // Component should still render even with empty message
      const errorCodeHeading = screen.getByRole('heading', { level: 1, name: '500' })
      expect(errorCodeHeading).toBeInTheDocument()

      // Error message paragraph should exist but be empty
      const messageParagraph = container.querySelector('.MuiTypography-body1')
      expect(messageParagraph).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('should render within a Container component', () => {
      const { container } = render(<ErrorPageDisplay {...defaultProps} />)

      // Container component uses MUI classes
      const containerElement = container.querySelector('.MuiContainer-root')
      expect(containerElement).toBeInTheDocument()
    })

    it('should render within a Paper component', () => {
      const { container } = render(<ErrorPageDisplay {...defaultProps} />)

      // Paper component uses MUI classes
      const paperElement = container.querySelector('.MuiPaper-root')
      expect(paperElement).toBeInTheDocument()
    })

    it('should render buttons in a flex container', () => {
      render(<ErrorPageDisplay {...defaultProps} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })
  })
})
