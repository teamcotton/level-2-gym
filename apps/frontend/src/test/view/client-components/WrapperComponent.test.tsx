import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Wrapper } from '@/view/client-components/WrapperComponent.js'

describe('Wrapper Component', () => {
  it('should render children content', () => {
    render(
      <Wrapper>
        <div>Test Content</div>
      </Wrapper>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render multiple children', () => {
    render(
      <Wrapper>
        <div>First Child</div>
        <div>Second Child</div>
        <div>Third Child</div>
      </Wrapper>
    )
    expect(screen.getByText('First Child')).toBeInTheDocument()
    expect(screen.getByText('Second Child')).toBeInTheDocument()
    expect(screen.getByText('Third Child')).toBeInTheDocument()
  })

  it('should render as a Material UI Container', () => {
    const { container } = render(
      <Wrapper>
        <div>Content</div>
      </Wrapper>
    )
    const muiContainer = container.querySelector('.MuiContainer-root')
    expect(muiContainer).toBeInTheDocument()
  })

  it('should have maxWidth="md" styling', () => {
    const { container } = render(
      <Wrapper>
        <div>Content</div>
      </Wrapper>
    )
    const muiContainer = container.querySelector('.MuiContainer-maxWidthMd')
    expect(muiContainer).toBeInTheDocument()
  })

  it('should apply flex column layout styling', () => {
    const { container } = render(
      <Wrapper>
        <div>Content</div>
      </Wrapper>
    )
    const muiContainer = container.querySelector('.MuiContainer-root')
    expect(muiContainer).toHaveStyle({ display: 'flex' })
    expect(muiContainer).toHaveStyle({ flexDirection: 'column' })
  })

  it('should have full viewport height', () => {
    const { container } = render(
      <Wrapper>
        <div>Content</div>
      </Wrapper>
    )
    const muiContainer = container.querySelector('.MuiContainer-root')
    expect(muiContainer).toHaveStyle({ height: '100vh' })
  })

  it('should render with empty children', () => {
    const { container } = render(<Wrapper>{null}</Wrapper>)
    const muiContainer = container.querySelector('.MuiContainer-root')
    expect(muiContainer).toBeInTheDocument()
  })

  it('should render nested components as children', () => {
    const NestedComponent = () => <div data-testid="nested">Nested Component</div>
    render(
      <Wrapper>
        <NestedComponent />
      </Wrapper>
    )
    expect(screen.getByTestId('nested')).toBeInTheDocument()
  })
})
