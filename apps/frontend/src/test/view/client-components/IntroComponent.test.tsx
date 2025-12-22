import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { IntroComponent } from '@/view/client-components/IntroComponent.js'

describe('IntroComponent', () => {
  it('should render the heading text', () => {
    render(<IntroComponent />)
    const heading = screen.getByText('AI Chat Assistant')
    expect(heading).toBeInTheDocument()
  })

  it('should render as an h1 element', () => {
    render(<IntroComponent />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('AI Chat Assistant')
  })

  it('should have the correct typography variant', () => {
    render(<IntroComponent />)
    const heading = screen.getByText('AI Chat Assistant')
    expect(heading).toHaveClass('MuiTypography-h4')
  })

  it('should have gutterBottom styling', () => {
    render(<IntroComponent />)
    const heading = screen.getByText('AI Chat Assistant')
    expect(heading).toHaveClass('MuiTypography-gutterBottom')
  })
})
