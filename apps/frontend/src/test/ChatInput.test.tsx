import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ChatInput } from '../view/components/ChatInputComponent.js'

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
})
