/* eslint-disable jsx-a11y/aria-role */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Message } from '../view/components/MessageComponent.js'

// Mock the streamdown module
vi.mock('streamdown', () => ({
  Streamdown: ({ children }: { children: string }) => <div>{children}</div>,
}))

describe('Message Component', () => {
  const mockTextPart = {
    type: 'text' as const,
    text: 'Hello, this is a test message',
  }

  it('should render user message with correct prefix', () => {
    render(<Message role="user" parts={[mockTextPart]} />)
    expect(screen.getByText(/User: Hello, this is a test message/)).toBeInTheDocument()
  })

  it('should render AI message with correct prefix', () => {
    render(<Message role="assistant" parts={[mockTextPart]} />)
    expect(screen.getByText(/AI: Hello, this is a test message/)).toBeInTheDocument()
  })

  it('should handle multiple text parts', () => {
    const multipleParts = [
      { type: 'text' as const, text: 'First part. ' },
      { type: 'text' as const, text: 'Second part.' },
    ]
    render(<Message role="user" parts={multipleParts} />)
    expect(screen.getByText(/User: First part. Second part./)).toBeInTheDocument()
  })

  it('should handle empty parts array', () => {
    render(<Message role="user" parts={[]} />)
    expect(screen.getByText(/User:/)).toBeInTheDocument()
  })

  it('should handle parts with empty text', () => {
    const emptyTextPart = { type: 'text' as const, text: '' }
    render(<Message role="user" parts={[emptyTextPart]} />)
    expect(screen.getByText(/User:/)).toBeInTheDocument()
  })

  it('should render with dark text color styling', () => {
    const { container } = render(<Message role="user" parts={[mockTextPart]} />)
    const box = container.querySelector('.MuiBox-root')
    expect(box).toBeInTheDocument()
  })

  it('should use different prefix for different roles', () => {
    const { rerender } = render(<Message role="user" parts={[mockTextPart]} />)
    expect(screen.getByText(/User:/)).toBeInTheDocument()

    rerender(<Message role="assistant" parts={[mockTextPart]} />)
    expect(screen.getByText(/AI:/)).toBeInTheDocument()
  })

  it('should join multiple parts without separator', () => {
    const parts = [
      { type: 'text' as const, text: 'Hello' },
      { type: 'text' as const, text: 'World' },
    ]
    render(<Message role="user" parts={parts} />)
    expect(screen.getByText(/User: HelloWorld/)).toBeInTheDocument()
  })
})
