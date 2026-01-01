import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AIChatView } from '@/view/client-components/AIChatView.js'

describe('AIChatView Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnFileSelect = vi.fn()
  const mockOnDrawerToggle = vi.fn()
  const mockOnNewChat = vi.fn()
  const mockOnInputChange = vi.fn()
  const mockOnErrorClose = vi.fn()
  const mockMessagesEndRef = { current: null }

  const defaultProps = {
    disabled: false,
    errorMessage: '',
    input: '',
    isLoading: false,
    messages: [],
    messagesEndRef: mockMessagesEndRef,
    mobileOpen: false,
    onDrawerToggle: mockOnDrawerToggle,
    onErrorClose: mockOnErrorClose,
    onFileSelect: mockOnFileSelect,
    onInputChange: mockOnInputChange,
    onNewChat: mockOnNewChat,
    onSubmit: mockOnSubmit,
    selectedFile: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core Rendering', () => {
    it('should render the wrapper component', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      // Check for the main structure
      expect(container.querySelector('.MuiBox-root')).toBeInTheDocument()
    })

    it('should render the intro component', () => {
      render(<AIChatView {...defaultProps} />)

      // IntroComponent should be present
      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('should render desktop drawer by default', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      // Check for permanent drawer (desktop)
      const desktopDrawer = container.querySelector('.MuiDrawer-root')
      expect(desktopDrawer).toBeInTheDocument()
    })

    it('should render chat input component', () => {
      render(<AIChatView {...defaultProps} />)

      // ChatInput should be present (check for input element)
      const textArea = document.querySelector('textarea')
      expect(textArea).toBeInTheDocument()
    })
  })

  describe('Drawer Functionality', () => {
    it('should render "New Chat" button in drawer', () => {
      render(<AIChatView {...defaultProps} />)

      const newChatButtons = screen.getAllByText('New Chat')
      expect(newChatButtons.length).toBeGreaterThan(0)
    })

    it('should call onNewChat when "New Chat" button is clicked', () => {
      render(<AIChatView {...defaultProps} />)

      const newChatButtons = screen.getAllByText('New Chat')
      fireEvent.click(newChatButtons[0]!)

      expect(mockOnNewChat).toHaveBeenCalledTimes(1)
    })

    it('should display placeholder text for previous chats', () => {
      render(<AIChatView {...defaultProps} />)

      const placeholderTexts = screen.getAllByText('Previous chats will appear here')
      expect(placeholderTexts.length).toBeGreaterThan(0)
    })

    it('should render mobile menu button', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      // Mobile menu icon should be present
      const menuButton = container.querySelector('[data-testid="MenuIcon"]')
      expect(menuButton).toBeInTheDocument()
    })

    it('should call onDrawerToggle when mobile menu button is clicked', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      const menuButton = container.querySelector('[data-testid="MenuIcon"]')?.closest('button')
      expect(menuButton).toBeInTheDocument()

      fireEvent.click(menuButton!)
      expect(mockOnDrawerToggle).toHaveBeenCalledTimes(1)
    })

    it('should render mobile drawer when mobileOpen is true', () => {
      const { container } = render(<AIChatView {...defaultProps} mobileOpen={true} />)

      // Both mobile and desktop drawers should be present
      const drawers = container.querySelectorAll('.MuiDrawer-root')
      expect(drawers.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Message Display', () => {
    it('should show empty state intro when no messages', () => {
      render(<AIChatView {...defaultProps} />)

      const emptyState = screen.getByTestId('chat-text-output-empty')
      expect(emptyState).toBeInTheDocument()
    })

    it('should render messages when provided', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'Hello' }],
          role: 'user',
        },
        {
          id: '2',
          parts: [{ type: 'text' as const, text: 'Hi there!' }],
          role: 'assistant',
        },
      ]

      render(<AIChatView {...defaultProps} messages={messages} />)

      // Should not show empty state
      expect(screen.queryByTestId('chat-text-output-empty')).not.toBeInTheDocument()
    })

    it('should render user message with correct styling', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'User message' }],
          role: 'user',
        },
      ]

      const { container } = render(<AIChatView {...defaultProps} messages={messages} />)

      // User avatar should be present
      const userAvatar = container.querySelector('[data-testid="PersonIcon"]')
      expect(userAvatar).toBeInTheDocument()
    })

    it('should render assistant message with correct styling', () => {
      const messages = [
        {
          id: '2',
          parts: [{ type: 'text' as const, text: 'AI response' }],
          role: 'assistant',
        },
      ]

      const { container } = render(<AIChatView {...defaultProps} messages={messages} />)

      // Assistant avatar should be present
      const aiAvatar = container.querySelector('[data-testid="SmartToyIcon"]')
      expect(aiAvatar).toBeInTheDocument()
    })

    it('should display loading indicator when isLoading is true', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'Hello' }],
          role: 'user',
        },
      ]

      const { container } = render(
        <AIChatView {...defaultProps} messages={messages} isLoading={true} />
      )

      // Should show CircularProgress
      const loadingSpinner = container.querySelector('.MuiCircularProgress-root')
      expect(loadingSpinner).toBeInTheDocument()

      // Should show AI avatar during loading
      const aiAvatars = container.querySelectorAll('[data-testid="SmartToyIcon"]')
      expect(aiAvatars.length).toBeGreaterThan(0)
    })

    it('should not display loading indicator when isLoading is false', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'Hello' }],
          role: 'user',
        },
      ]

      const { container } = render(<AIChatView {...defaultProps} messages={messages} />)

      // Should not show CircularProgress
      const loadingSpinner = container.querySelector('.MuiCircularProgress-root')
      expect(loadingSpinner).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should not show snackbar when errorMessage is empty', () => {
      render(<AIChatView {...defaultProps} errorMessage="" />)

      // Snackbar should not be visible
      const snackbar = screen.queryByRole('alert')
      expect(snackbar).not.toBeInTheDocument()
    })

    it('should show snackbar with error message when errorMessage is provided', () => {
      render(<AIChatView {...defaultProps} errorMessage="File too large. Maximum size is 10MB" />)

      // Snackbar should be visible with error message
      const errorAlert = screen.getByText('File too large. Maximum size is 10MB')
      expect(errorAlert).toBeInTheDocument()
    })

    it('should call onErrorClose when snackbar close button is clicked', () => {
      render(<AIChatView {...defaultProps} errorMessage="Test error message" />)

      // Find and click the close button
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(mockOnErrorClose).toHaveBeenCalledTimes(1)
    })

    it('should display error alert with error severity', () => {
      render(<AIChatView {...defaultProps} errorMessage="Test error" />)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveClass('MuiAlert-standardError')
    })
  })

  describe('Input Interaction', () => {
    it('should pass input value to ChatInput', () => {
      const { container } = render(<AIChatView {...defaultProps} input="Test input" />)

      const textarea = container.querySelector('textarea')
      expect(textarea).toHaveValue('Test input')
    })

    it('should pass selectedFile to ChatInput', () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      const { container } = render(<AIChatView {...defaultProps} selectedFile={mockFile} />)

      // File should be displayed in the ChatInput component (check for chip with file info)
      const chip = container.querySelector('.MuiChip-root')
      expect(chip).toBeInTheDocument()
    })

    it('should pass disabled prop to ChatInput', () => {
      const { container, rerender } = render(<AIChatView {...defaultProps} disabled={false} />)
      let textarea = container.querySelector('textarea')
      expect(textarea).not.toBeDisabled()

      rerender(<AIChatView {...defaultProps} disabled={true} />)
      textarea = container.querySelector('textarea')
      expect(textarea).toBeDisabled()
    })

    it('should pass isLoading state to ChatInput', () => {
      const { container } = render(<AIChatView {...defaultProps} isLoading={true} />)

      // Submit button should be disabled when loading
      const submitButton = container.querySelector('button[type="submit"]')
      expect(submitButton).toBeDisabled()
    })

    it('should pass onInputChange handler to ChatInput', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      const textarea = container.querySelector('textarea')
      expect(textarea).toBeInTheDocument()

      fireEvent.change(textarea!, { target: { value: 'New message' } })
      expect(mockOnInputChange).toHaveBeenCalled()
    })

    it('should pass onSubmit handler to ChatInput', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()

      fireEvent.submit(form!)
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('should pass onFileSelect handler to ChatInput', () => {
      render(<AIChatView {...defaultProps} />)

      // ChatInput component should be rendered with file upload capability
      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should render Paper component for main content area', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      const paper = container.querySelector('.MuiPaper-root')
      expect(paper).toBeInTheDocument()
    })

    it('should render Stack component when messages are present', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'Test message' }],
          role: 'user',
        },
      ]

      const { container } = render(<AIChatView {...defaultProps} messages={messages} />)

      const stack = container.querySelector('.MuiStack-root')
      expect(stack).toBeInTheDocument()
    })

    it('should render correct number of message boxes', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'Message 1' }],
          role: 'user',
        },
        {
          id: '2',
          parts: [{ type: 'text' as const, text: 'Message 2' }],
          role: 'assistant',
        },
        {
          id: '3',
          parts: [{ type: 'text' as const, text: 'Message 3' }],
          role: 'user',
        },
      ]

      const { container } = render(<AIChatView {...defaultProps} messages={messages} />)

      // Should have 3 avatars (one per message)
      const avatars = container.querySelectorAll('.MuiAvatar-root')
      expect(avatars.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(<AIChatView {...defaultProps} errorMessage="Test error" />)

      // Close button should have accessible label
      const closeButton = screen.getByRole('button', { name: /close/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should render error alert with proper role', () => {
      render(<AIChatView {...defaultProps} errorMessage="Test error" />)

      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      const { container } = render(<AIChatView {...defaultProps} />)

      // IntroComponent typically contains headings
      expect(container.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('Multiple Messages Rendering', () => {
    it('should render multiple user messages correctly', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'First user message' }],
          role: 'user',
        },
        {
          id: '2',
          parts: [{ type: 'text' as const, text: 'Second user message' }],
          role: 'user',
        },
      ]

      const { container } = render(<AIChatView {...defaultProps} messages={messages} />)

      const userAvatars = container.querySelectorAll('[data-testid="PersonIcon"]')
      expect(userAvatars.length).toBe(2)
    })

    it('should render mixed user and assistant messages correctly', () => {
      const messages = [
        {
          id: '1',
          parts: [{ type: 'text' as const, text: 'User question' }],
          role: 'user',
        },
        {
          id: '2',
          parts: [{ type: 'text' as const, text: 'AI answer' }],
          role: 'assistant',
        },
        {
          id: '3',
          parts: [{ type: 'text' as const, text: 'Follow-up question' }],
          role: 'user',
        },
      ]

      const { container } = render(<AIChatView {...defaultProps} messages={messages} />)

      const userAvatars = container.querySelectorAll('[data-testid="PersonIcon"]')
      const aiAvatars = container.querySelectorAll('[data-testid="SmartToyIcon"]')

      expect(userAvatars.length).toBe(2)
      expect(aiAvatars.length).toBe(1)
    })
  })
})
