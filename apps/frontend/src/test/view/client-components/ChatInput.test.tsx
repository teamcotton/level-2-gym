import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ChatInput } from '@/view/client-components/ChatInputComponent.js'

describe('ChatInput Component', () => {
  const defaultProps = {
    input: '',
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  }

  it('should render the input field with placeholder', () => {
    render(<ChatInput {...defaultProps} />)
    const input = screen.getByPlaceholderText('Type your message...')
    expect(input).toBeInTheDocument()
  })

  it('should display the input value', () => {
    const testValue = 'Hello, AI!'
    render(<ChatInput {...defaultProps} input={testValue} />)
    const input = screen.getByDisplayValue(testValue)
    expect(input).toBeInTheDocument()
  })

  it('should call onChange when user types', () => {
    const onChange = vi.fn()
    render(<ChatInput {...defaultProps} onChange={onChange} />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.change(input, { target: { value: 'Test message' } })

    expect(onChange).toHaveBeenCalled()
  })

  it('should call onSubmit when form is submitted', () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<ChatInput {...defaultProps} input="Test" onSubmit={onSubmit} />)

    const submitButton = screen.getByRole('button')
    fireEvent.click(submitButton)

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('should call onSubmit when Enter key is pressed without Shift', () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<ChatInput {...defaultProps} input="Test" onSubmit={onSubmit} />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    expect(onSubmit).toHaveBeenCalled()
  })

  it('should not call onSubmit when Shift+Enter is pressed', () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<ChatInput {...defaultProps} input="Test" onSubmit={onSubmit} />)

    const input = screen.getByPlaceholderText('Type your message...')
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should disable input when isLoading is true', () => {
    render(<ChatInput {...defaultProps} isLoading={true} />)
    const input = screen.getByPlaceholderText('Type your message...')
    expect(input).toBeDisabled()
  })

  it('should disable submit button when isLoading is true', () => {
    render(<ChatInput {...defaultProps} input="Test" isLoading={true} />)
    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeDisabled()
  })

  it('should disable submit button when input is empty', () => {
    render(<ChatInput {...defaultProps} input="" />)
    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeDisabled()
  })

  it('should disable submit button when input is only whitespace', () => {
    render(<ChatInput {...defaultProps} input="   " />)
    const submitButton = screen.getByRole('button')
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when input has content and not loading', () => {
    render(<ChatInput {...defaultProps} input="Valid message" />)
    const submitButton = screen.getByRole('button')
    expect(submitButton).not.toBeDisabled()
  })

  it('should render send icon', () => {
    render(<ChatInput {...defaultProps} />)
    const sendIcon = screen.getByRole('button').querySelector('svg')
    expect(sendIcon).toBeInTheDocument()
  })

  it('should support multiline input', () => {
    render(<ChatInput {...defaultProps} />)
    const input = screen.getByPlaceholderText('Type your message...')
    // TextField with multiline prop creates a textarea element
    expect(input.tagName).toBe('TEXTAREA')
  })

  describe('File Upload Features', () => {
    it('should render file upload button when enableFileUpload is true', () => {
      const onFileSelect = vi.fn()
      render(<ChatInput {...defaultProps} enableFileUpload={true} onFileSelect={onFileSelect} />)

      const buttons = screen.getAllByRole('button')
      // Should have 2 buttons: file upload and send
      expect(buttons).toHaveLength(2)

      // Find the file upload button (should have AttachFileIcon)
      const fileUploadButton = buttons[0]
      expect(fileUploadButton).toBeDefined()
      expect(fileUploadButton?.querySelector('svg')).toBeInTheDocument()
    })

    it('should not render file upload button when enableFileUpload is false', () => {
      render(<ChatInput {...defaultProps} enableFileUpload={false} />)

      const buttons = screen.getAllByRole('button')
      // Should only have send button
      expect(buttons).toHaveLength(1)
    })

    it('should call onFileSelect when file is selected', () => {
      const onFileSelect = vi.fn()
      render(<ChatInput {...defaultProps} enableFileUpload={true} onFileSelect={onFileSelect} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(onFileSelect).toHaveBeenCalledWith(file)
    })

    it('should display selected file chip with correct name and size', () => {
      const file = new File(['a'.repeat(2048)], 'document.pdf', { type: 'application/pdf' })
      render(
        <ChatInput
          {...defaultProps}
          enableFileUpload={true}
          onFileSelect={vi.fn()}
          selectedFile={file}
        />
      )

      // Check if chip is displayed
      const chip = screen.getByText(/document\.pdf/)
      expect(chip).toBeInTheDocument()

      // Check if size is displayed correctly (2048 bytes = 2.0 KB)
      expect(chip).toHaveTextContent('2.0 KB')
    })

    it('should call onFileSelect with null when file chip delete is clicked', () => {
      const onFileSelect = vi.fn()
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const { container } = render(
        <ChatInput
          {...defaultProps}
          enableFileUpload={true}
          onFileSelect={onFileSelect}
          selectedFile={file}
        />
      )

      // Find the delete button in the chip (MUI uses CancelIcon)
      const deleteButton = container.querySelector('.MuiChip-deleteIcon') as HTMLElement
      expect(deleteButton).toBeInTheDocument()

      fireEvent.click(deleteButton)

      expect(onFileSelect).toHaveBeenCalledWith(null)
    })

    it('should disable file upload button when isLoading is true', () => {
      render(
        <ChatInput
          {...defaultProps}
          enableFileUpload={true}
          onFileSelect={vi.fn()}
          isLoading={true}
        />
      )

      const buttons = screen.getAllByRole('button')
      const fileUploadButton = buttons[0]

      // MUI IconButton uses aria-disabled attribute
      expect(fileUploadButton).toHaveAttribute('aria-disabled', 'true')
    })

    it('should accept correct file types in file input', () => {
      render(<ChatInput {...defaultProps} enableFileUpload={true} onFileSelect={vi.fn()} />)

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()

      const acceptedTypes = fileInput.getAttribute('accept')
      expect(acceptedTypes).toBe('image/*,.pdf,.doc,.docx,.txt')
    })

    it('should not display file chip when no file is selected', () => {
      render(
        <ChatInput
          {...defaultProps}
          enableFileUpload={true}
          onFileSelect={vi.fn()}
          selectedFile={null}
        />
      )

      const chip = screen.queryByText(/KB/)
      expect(chip).not.toBeInTheDocument()
    })

    it('should not display file chip when enableFileUpload is false even if file is provided', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      render(<ChatInput {...defaultProps} enableFileUpload={false} selectedFile={file} />)

      const chip = screen.queryByText(/test\.txt/)
      expect(chip).not.toBeInTheDocument()
    })
  })
})
