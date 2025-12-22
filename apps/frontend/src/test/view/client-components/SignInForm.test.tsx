import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { SignInForm } from '@/view/client-components/SignInForm.js'

// Mock Next.js router
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

describe('SignInForm', () => {
  const mockPush = vi.fn()
  const mockOnFieldChange = vi.fn()
  const mockOnSubmit = vi.fn()
  const mockOnGoogleSignIn = vi.fn()
  const mockOnGitHubSignIn = vi.fn()

  const defaultProps = {
    formData: {
      email: '',
      password: '',
    },
    errors: {
      email: '',
      password: '',
    },
    onFieldChange: mockOnFieldChange,
    onSubmit: mockOnSubmit,
    onGoogleSignIn: mockOnGoogleSignIn,
    onGitHubSignIn: mockOnGitHubSignIn,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue({
      push: mockPush,
    })
  })

  describe('Rendering', () => {
    it('should render the sign-in form with all fields', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('should render OAuth buttons', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument()
    })

    it('should render sign in button', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    })

    it('should render forgot password link', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.getByText(/forgot password\?/i)).toBeInTheDocument()
    })

    it('should render sign up link', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    })

    it('should display the "Sign in with" text', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.getByText('Sign in with')).toBeInTheDocument()
    })

    it('should display divider text "Or sign in with email"', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.getByText(/or sign in with email/i)).toBeInTheDocument()
    })
  })

  describe('Form Data Display', () => {
    it('should display email value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, email: 'test@example.com' },
      }
      render(<SignInForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      expect(emailInput.value).toBe('test@example.com')
    })

    it('should display password value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, password: 'mypassword123' },
      }
      render(<SignInForm {...props} />)

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
      expect(passwordInput.value).toBe('mypassword123')
    })
  })

  describe('Error Display', () => {
    it('should display email error message', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, email: 'Email is required' },
      }
      render(<SignInForm {...props} />)

      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })

    it('should display password error message', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, password: 'Password is required' },
      }
      render(<SignInForm {...props} />)

      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('should display multiple error messages simultaneously', () => {
      const props = {
        ...defaultProps,
        errors: {
          email: 'Email is required',
          password: 'Password is required',
        },
      }
      render(<SignInForm {...props} />)

      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('should display invalid email error', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, email: 'Please enter a valid email address' },
      }
      render(<SignInForm {...props} />)

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  describe('User Interactions - Field Changes', () => {
    it('should call onFieldChange when email field changes', () => {
      const mockEmailHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockEmailHandler)

      render(<SignInForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('email')
      expect(mockEmailHandler).toHaveBeenCalled()
    })

    it('should call onFieldChange when password field changes', () => {
      const mockPasswordHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockPasswordHandler)

      render(<SignInForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/password/i)
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('password')
      expect(mockPasswordHandler).toHaveBeenCalled()
    })
  })

  describe('User Interactions - Form Submission', () => {
    it('should call onSubmit when form is submitted', () => {
      render(<SignInForm {...defaultProps} />)

      const form = screen.getByRole('button', { name: /^sign in$/i }).closest('form')
      fireEvent.submit(form!)

      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('should call onSubmit when sign in button is clicked', () => {
      render(<SignInForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      fireEvent.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  describe('User Interactions - OAuth Buttons', () => {
    it('should call onGoogleSignIn when Google button is clicked', () => {
      render(<SignInForm {...defaultProps} />)

      const googleButton = screen.getByRole('button', { name: /google/i })
      fireEvent.click(googleButton)

      expect(mockOnGoogleSignIn).toHaveBeenCalledTimes(1)
    })

    it('should call onGitHubSignIn when GitHub button is clicked', () => {
      render(<SignInForm {...defaultProps} />)

      const githubButton = screen.getByRole('button', { name: /github/i })
      fireEvent.click(githubButton)

      expect(mockOnGitHubSignIn).toHaveBeenCalledTimes(1)
    })

    it('should not call onSubmit when OAuth buttons are clicked', () => {
      render(<SignInForm {...defaultProps} />)

      const googleButton = screen.getByRole('button', { name: /google/i })
      const githubButton = screen.getByRole('button', { name: /github/i })

      fireEvent.click(googleButton)
      fireEvent.click(githubButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('should navigate to forgot password page when forgot password link is clicked', () => {
      render(<SignInForm {...defaultProps} />)

      const forgotPasswordLink = screen.getByRole('button', { name: /forgot password\?/i })
      fireEvent.click(forgotPasswordLink)

      expect(mockPush).toHaveBeenCalledWith('/forgot-password')
    })

    it('should navigate to registration page when sign up link is clicked', () => {
      render(<SignInForm {...defaultProps} />)

      const signUpLink = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(signUpLink)

      expect(mockPush).toHaveBeenCalledWith('/registration')
    })
  })

  describe('Field Attributes', () => {
    it('should have email field with correct type', () => {
      render(<SignInForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should have password field with correct type', () => {
      render(<SignInForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should have email field with autocomplete attribute', () => {
      render(<SignInForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
    })

    it('should have password field with autocomplete attribute', () => {
      render(<SignInForm {...defaultProps} />)

      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })

    it('should have all input fields marked as required', () => {
      render(<SignInForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toBeRequired()
      expect(passwordInput).toBeRequired()
    })

    it('should have form with noValidate attribute', () => {
      render(<SignInForm {...defaultProps} />)

      const form = screen.getByRole('button', { name: /^sign in$/i }).closest('form')
      expect(form).toHaveAttribute('novalidate')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<SignInForm {...defaultProps} />)

      const heading = screen.getByRole('heading', { name: /welcome back/i })
      expect(heading.tagName).toBe('H1')
    })

    it('should associate error messages with input fields', () => {
      const props = {
        ...defaultProps,
        errors: {
          email: 'Email is required',
          password: 'Password is required',
        },
      }
      render(<SignInForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('should not have aria-invalid on fields without errors', () => {
      render(<SignInForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete user sign-in flow', () => {
      const mockEmailHandler = vi.fn()
      const mockPasswordHandler = vi.fn()

      mockOnFieldChange
        .mockReturnValueOnce(mockEmailHandler)
        .mockReturnValueOnce(mockPasswordHandler)

      render(<SignInForm {...defaultProps} />)

      // Fill in all fields
      const emailInput = screen.getByLabelText(/email address/i)
      const passwordInput = screen.getByLabelText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      fireEvent.click(submitButton)

      // Verify all handlers were called
      expect(mockOnFieldChange).toHaveBeenCalledWith('email')
      expect(mockOnFieldChange).toHaveBeenCalledWith('password')
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('should display all errors after validation failure', () => {
      const props = {
        ...defaultProps,
        errors: {
          email: 'Please enter a valid email address',
          password: 'Password is required',
        },
      }
      render(<SignInForm {...props} />)

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    it('should show error state styling when errors are present', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, email: 'Email is required' },
      }
      render(<SignInForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Button States', () => {
    it('should render submit button with correct type', () => {
      render(<SignInForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /^sign in$/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should render OAuth buttons with button type (not submit)', () => {
      render(<SignInForm {...defaultProps} />)

      const googleButton = screen.getByRole('button', { name: /google/i })
      const githubButton = screen.getByRole('button', { name: /github/i })

      expect(googleButton).not.toHaveAttribute('type', 'submit')
      expect(githubButton).not.toHaveAttribute('type', 'submit')
    })

    it('should render navigation links as buttons', () => {
      render(<SignInForm {...defaultProps} />)

      const forgotPasswordLink = screen.getByRole('button', { name: /forgot password\?/i })
      const signUpLink = screen.getByRole('button', { name: /sign up/i })

      expect(forgotPasswordLink).toHaveAttribute('type', 'button')
      expect(signUpLink).toHaveAttribute('type', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty formData gracefully', () => {
      render(<SignInForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement

      expect(emailInput.value).toBe('')
      expect(passwordInput.value).toBe('')
    })

    it('should handle all empty errors gracefully', () => {
      render(<SignInForm {...defaultProps} />)

      expect(screen.queryByText(/is required/i)).not.toBeInTheDocument()
    })

    it('should handle rapid consecutive field changes', () => {
      const mockEmailHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockEmailHandler)

      render(<SignInForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(emailInput, { target: { value: 't' } })
      fireEvent.change(emailInput, { target: { value: 'te' } })
      fireEvent.change(emailInput, { target: { value: 'tes' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(mockEmailHandler).toHaveBeenCalledTimes(4)
    })

    it('should handle multiple form submissions', () => {
      render(<SignInForm {...defaultProps} />)

      const form = screen.getByRole('button', { name: /^sign in$/i }).closest('form')

      fireEvent.submit(form!)
      fireEvent.submit(form!)
      fireEvent.submit(form!)

      expect(mockOnSubmit).toHaveBeenCalledTimes(3)
    })

    it('should handle long email addresses', () => {
      const longEmail = 'very.long.email.address.with.many.dots@example.com'
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, email: longEmail },
      }
      render(<SignInForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      expect(emailInput.value).toBe(longEmail)
    })

    it('should handle special characters in password', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, password: specialPassword },
      }
      render(<SignInForm {...props} />)

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
      expect(passwordInput.value).toBe(specialPassword)
    })
  })

  describe('Component Structure', () => {
    it('should render within a Container component', () => {
      const { container } = render(<SignInForm {...defaultProps} />)

      const containerElement = container.querySelector('.MuiContainer-root')
      expect(containerElement).toBeInTheDocument()
    })

    it('should render within a Paper component', () => {
      const { container } = render(<SignInForm {...defaultProps} />)

      const paperElement = container.querySelector('.MuiPaper-root')
      expect(paperElement).toBeInTheDocument()
    })

    it('should have OAuth buttons in a Box with gap', () => {
      render(<SignInForm {...defaultProps} />)

      const googleButton = screen.getByRole('button', { name: /google/i })
      const parentBox = googleButton.parentElement

      expect(parentBox).toBeInTheDocument()
      expect(parentBox?.className).toContain('MuiBox-root')
    })
  })
})
