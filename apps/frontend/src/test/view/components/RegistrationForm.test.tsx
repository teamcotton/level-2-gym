import { fireEvent, render, screen } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { RegistrationForm } from '@/view/components/RegistrationForm.js'

// Mock Next.js router
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

describe('RegistrationForm', () => {
  const mockPush = vi.fn()
  const mockOnFieldChange = vi.fn()
  const mockOnSubmit = vi.fn()
  const mockOnGoogleSignUp = vi.fn()
  const mockOnGitHubSignUp = vi.fn()

  const defaultProps = {
    formData: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
    errors: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
    onFieldChange: mockOnFieldChange,
    onSubmit: mockOnSubmit,
    onGoogleSignUp: mockOnGoogleSignUp,
    onGitHubSignUp: mockOnGitHubSignUp,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue({
      push: mockPush,
    })
  })

  describe('Rendering', () => {
    it('should render the registration form with all fields', () => {
      render(<RegistrationForm {...defaultProps} />)

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()

      const passwordFields = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })
      expect(passwordFields).toHaveLength(2)
    })

    it('should render OAuth buttons', () => {
      render(<RegistrationForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /github/i })).toBeInTheDocument()
    })

    it('should render create account button', () => {
      render(<RegistrationForm {...defaultProps} />)

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('should render sign in link', () => {
      render(<RegistrationForm {...defaultProps} />)

      expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render terms of service text', () => {
      render(<RegistrationForm {...defaultProps} />)

      expect(
        screen.getByText(
          /by creating an account, you agree to our terms of service and privacy policy/i
        )
      ).toBeInTheDocument()
    })

    it('should display the "Sign up with" text', () => {
      render(<RegistrationForm {...defaultProps} />)

      expect(screen.getByText('Sign up with')).toBeInTheDocument()
    })

    it('should display divider text "Or sign up with email"', () => {
      render(<RegistrationForm {...defaultProps} />)

      expect(screen.getByText(/or sign up with email/i)).toBeInTheDocument()
    })
  })

  describe('Form Data Display', () => {
    it('should display email value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, email: 'test@example.com' },
      }
      render(<RegistrationForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      expect(emailInput.value).toBe('test@example.com')
    })

    it('should display name value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, name: 'John Doe' },
      }
      render(<RegistrationForm {...props} />)

      const nameInput = screen.getByLabelText(/^name/i) as HTMLInputElement
      expect(nameInput.value).toBe('John Doe')
    })

    it('should display password value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, password: 'mypassword123' },
      }
      render(<RegistrationForm {...props} />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0] as HTMLInputElement
      expect(passwordInput.value).toBe('mypassword123')
    })

    it('should display confirm password value from props', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, confirmPassword: 'mypassword123' },
      }
      render(<RegistrationForm {...props} />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i, {
        selector: 'input',
      }) as HTMLInputElement
      expect(confirmPasswordInput.value).toBe('mypassword123')
    })
  })

  describe('Error Display', () => {
    it('should display email error message', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, email: 'Email is required' },
      }
      render(<RegistrationForm {...props} />)

      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })

    it('should display name error message', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, name: 'Name is required' },
      }
      render(<RegistrationForm {...props} />)

      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })

    it('should display password error message', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, password: 'Password must be at least 12 characters' },
      }
      render(<RegistrationForm {...props} />)

      expect(screen.getByText('Password must be at least 12 characters')).toBeInTheDocument()
    })

    it('should display confirm password error message', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, confirmPassword: 'Passwords do not match' },
      }
      render(<RegistrationForm {...props} />)

      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    it('should display multiple error messages simultaneously', () => {
      const props = {
        ...defaultProps,
        errors: {
          email: 'Email is required',
          name: 'Name is required',
          password: 'Password is required',
          confirmPassword: 'Confirm password is required',
        },
      }
      render(<RegistrationForm {...props} />)

      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Name is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
      expect(screen.getByText('Confirm password is required')).toBeInTheDocument()
    })
  })

  describe('User Interactions - Field Changes', () => {
    it('should call onFieldChange when email field changes', () => {
      const mockEmailHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockEmailHandler)

      render(<RegistrationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('email')
      expect(mockEmailHandler).toHaveBeenCalled()
    })

    it('should call onFieldChange when name field changes', () => {
      const mockNameHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockNameHandler)

      render(<RegistrationForm {...defaultProps} />)

      const nameInput = screen.getByLabelText(/^name/i)
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('name')
      expect(mockNameHandler).toHaveBeenCalled()
    })

    it('should call onFieldChange when password field changes', () => {
      const mockPasswordHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockPasswordHandler)

      render(<RegistrationForm {...defaultProps} />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      fireEvent.change(passwordInput as Element, { target: { value: 'password123' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('password')
      expect(mockPasswordHandler).toHaveBeenCalled()
    })

    it('should call onFieldChange when confirm password field changes', () => {
      const mockConfirmPasswordHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockConfirmPasswordHandler)

      render(<RegistrationForm {...defaultProps} />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i, { selector: 'input' })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      expect(mockOnFieldChange).toHaveBeenCalledWith('confirmPassword')
      expect(mockConfirmPasswordHandler).toHaveBeenCalled()
    })
  })

  describe('User Interactions - Form Submission', () => {
    it('should call onSubmit when form is submitted', () => {
      render(<RegistrationForm {...defaultProps} />)

      const form = screen.getByRole('button', { name: /create account/i }).closest('form')
      fireEvent.submit(form!)

      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('should call onSubmit when create account button is clicked', () => {
      render(<RegistrationForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  describe('User Interactions - OAuth Buttons', () => {
    it('should call onGoogleSignUp when Google button is clicked', () => {
      render(<RegistrationForm {...defaultProps} />)

      const googleButton = screen.getByRole('button', { name: /google/i })
      fireEvent.click(googleButton)

      expect(mockOnGoogleSignUp).toHaveBeenCalledTimes(1)
    })

    it('should call onGitHubSignUp when GitHub button is clicked', () => {
      render(<RegistrationForm {...defaultProps} />)

      const githubButton = screen.getByRole('button', { name: /github/i })
      fireEvent.click(githubButton)

      expect(mockOnGitHubSignUp).toHaveBeenCalledTimes(1)
    })

    it('should not call onSubmit when OAuth buttons are clicked', () => {
      render(<RegistrationForm {...defaultProps} />)

      const googleButton = screen.getByRole('button', { name: /google/i })
      const githubButton = screen.getByRole('button', { name: /github/i })

      fireEvent.click(googleButton)
      fireEvent.click(githubButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Navigation', () => {
    it('should navigate to sign in page when sign in link is clicked', () => {
      render(<RegistrationForm {...defaultProps} />)

      const signInLink = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(signInLink)

      expect(mockPush).toHaveBeenCalledWith('/signin')
    })
  })

  describe('Field Attributes', () => {
    it('should have email field with correct type', () => {
      render(<RegistrationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should have password field with correct type', () => {
      render(<RegistrationForm {...defaultProps} />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should have confirm password field with correct type', () => {
      render(<RegistrationForm {...defaultProps} />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i, { selector: 'input' })
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })

    it('should have email field with autocomplete attribute', () => {
      render(<RegistrationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
    })

    it('should have name field with autocomplete attribute', () => {
      render(<RegistrationForm {...defaultProps} />)

      const nameInput = screen.getByLabelText(/^name/i)
      expect(nameInput).toHaveAttribute('autocomplete', 'name')
    })

    it('should have password fields with autocomplete attribute', () => {
      render(<RegistrationForm {...defaultProps} />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = passwordInputs[1]

      expect(passwordInput).toHaveAttribute('autocomplete', 'new-password')
      expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password')
    })

    it('should have all input fields marked as required', () => {
      render(<RegistrationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      const nameInput = screen.getByLabelText(/^name/i)
      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = passwordInputs[1]

      expect(emailInput).toBeRequired()
      expect(nameInput).toBeRequired()
      expect(passwordInput).toBeRequired()
      expect(confirmPasswordInput).toBeRequired()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<RegistrationForm {...defaultProps} />)

      const heading = screen.getByRole('heading', { name: /create your account/i })
      expect(heading.tagName).toBe('H1')
    })

    it('should associate error messages with input fields', () => {
      const props = {
        ...defaultProps,
        errors: {
          email: 'Email is required',
          name: 'Name is required',
          password: 'Password is required',
          confirmPassword: 'Passwords do not match',
        },
      }
      render(<RegistrationForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i)
      const nameInput = screen.getByLabelText(/name/i)
      const [passwordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })
      const [, confirmPasswordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })

      // Fields with errors should have aria-invalid
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      expect(nameInput).toHaveAttribute('aria-invalid', 'true')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'true')
    })

    it('should not have aria-invalid on fields without errors', () => {
      render(<RegistrationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)
      const nameInput = screen.getByLabelText(/^name/i)
      const [passwordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })
      const [, confirmPasswordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })

      expect(emailInput).toHaveAttribute('aria-invalid', 'false')
      expect(nameInput).toHaveAttribute('aria-invalid', 'false')
      expect(passwordInput).toHaveAttribute('aria-invalid', 'false')
      expect(confirmPasswordInput).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete user registration flow', () => {
      const mockEmailHandler = vi.fn()
      const mockNameHandler = vi.fn()
      const mockPasswordHandler = vi.fn()
      const mockConfirmPasswordHandler = vi.fn()

      mockOnFieldChange
        .mockReturnValueOnce(mockEmailHandler)
        .mockReturnValueOnce(mockNameHandler)
        .mockReturnValueOnce(mockPasswordHandler)
        .mockReturnValueOnce(mockConfirmPasswordHandler)

      render(<RegistrationForm {...defaultProps} />)

      // Fill in all fields
      const emailInput = screen.getByLabelText(/email address/i)
      const nameInput = screen.getByLabelText(/^name/i)
      const [passwordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })
      const [, confirmPasswordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })
      fireEvent.change(passwordInput!, { target: { value: 'securepassword123' } })
      fireEvent.change(confirmPasswordInput!, { target: { value: 'securepassword123' } })

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      fireEvent.click(submitButton)

      // Verify all handlers were called
      expect(mockOnFieldChange).toHaveBeenCalledWith('email')
      expect(mockOnFieldChange).toHaveBeenCalledWith('name')
      expect(mockOnFieldChange).toHaveBeenCalledWith('password')
      expect(mockOnFieldChange).toHaveBeenCalledWith('confirmPassword')
      expect(mockOnSubmit).toHaveBeenCalled()
    })

    it('should display all errors after validation failure', () => {
      const props = {
        ...defaultProps,
        errors: {
          email: 'Please enter a valid email address',
          name: 'Name must be at least 2 characters',
          password: 'Password must be at least 12 characters',
          confirmPassword: 'Passwords do not match',
        },
      }
      render(<RegistrationForm {...props} />)

      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 12 characters')).toBeInTheDocument()
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })

    it('should show error state styling when errors are present', () => {
      const props = {
        ...defaultProps,
        errors: { ...defaultProps.errors, email: 'Email is required' },
      }
      render(<RegistrationForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i)
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Button States', () => {
    it('should render submit button with correct type', () => {
      render(<RegistrationForm {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('should render OAuth buttons with button type (not submit)', () => {
      render(<RegistrationForm {...defaultProps} />)

      const googleButton = screen.getByRole('button', { name: /google/i })
      const githubButton = screen.getByRole('button', { name: /github/i })

      // These should not be submit buttons
      expect(googleButton).toHaveAttribute('type', 'button')
      expect(githubButton).toHaveAttribute('type', 'button')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty formData gracefully', () => {
      render(<RegistrationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      const nameInput = screen.getByLabelText(/^name/i) as HTMLInputElement
      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0] as HTMLInputElement
      const confirmPasswordInput = passwordInputs[1] as HTMLInputElement

      expect(emailInput.value).toBe('')
      expect(nameInput.value).toBe('')
      expect(passwordInput.value).toBe('')
      expect(confirmPasswordInput.value).toBe('')
    })

    it('should handle all empty errors gracefully', () => {
      render(<RegistrationForm {...defaultProps} />)

      // Should not display any error messages
      expect(screen.queryByText(/is required/i)).not.toBeInTheDocument()
    })

    it('should handle rapid consecutive field changes', () => {
      const mockEmailHandler = vi.fn()
      mockOnFieldChange.mockReturnValue(mockEmailHandler)

      render(<RegistrationForm {...defaultProps} />)

      const emailInput = screen.getByLabelText(/email address/i)

      fireEvent.change(emailInput, { target: { value: 't' } })
      fireEvent.change(emailInput, { target: { value: 'te' } })
      fireEvent.change(emailInput, { target: { value: 'tes' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(mockEmailHandler).toHaveBeenCalledTimes(4)
    })

    it('should handle multiple form submissions', () => {
      render(<RegistrationForm {...defaultProps} />)

      const form = screen.getByRole('button', { name: /create account/i }).closest('form')

      fireEvent.submit(form!)
      fireEvent.submit(form!)
      fireEvent.submit(form!)

      expect(mockOnSubmit).toHaveBeenCalledTimes(3)
    })
    it('should have form with noValidate attribute', () => {
      render(<RegistrationForm {...defaultProps} />)

      const form = screen.getByRole('button', { name: /create account/i }).closest('form')
      expect(form).toHaveAttribute('novalidate')
    })
    it('should handle long email addresses', () => {
      const longEmail = 'very.long.email.address.with.many.dots@example.com'
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, email: longEmail },
      }
      render(<RegistrationForm {...props} />)

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement
      expect(emailInput.value).toBe(longEmail)
    })

    it('should handle special characters in password', () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, password: specialPassword },
      }
      render(<RegistrationForm {...props} />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0] as HTMLInputElement
      expect(passwordInput.value).toBe(specialPassword)
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should render password field with visibility toggle button', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle password visibility/i)
      expect(toggleButton).toBeInTheDocument()
    })

    it('should render confirm password field with visibility toggle button', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle confirm password visibility/i)
      expect(toggleButton).toBeInTheDocument()
    })

    it('should initially render password field as type password', () => {
      render(<RegistrationForm {...defaultProps} />)

      const [passwordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should initially render confirm password field as type password', () => {
      render(<RegistrationForm {...defaultProps} />)

      const [, confirmPasswordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input[type="password"]',
      })
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle password field type from password to text when clicking visibility button', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle password visibility/i)
      const passwordInput = screen.getAllByLabelText(/password/i, {
        selector: 'input',
      })[0]

      // Initially type="password"
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle button
      fireEvent.click(toggleButton)

      // Should change to type="text"
      expect(passwordInput).toHaveAttribute('type', 'text')
    })

    it('should toggle password field type from text back to password when clicking visibility button twice', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle password visibility/i)
      const passwordInput = screen.getAllByLabelText(/password/i, {
        selector: 'input',
      })[0]

      // Click toggle button twice
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)

      // Should be back to type="password"
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle confirm password field type from password to text when clicking visibility button', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle confirm password visibility/i)
      const confirmPasswordInput = screen.getAllByLabelText(/password/i, {
        selector: 'input',
      })[1]

      // Initially type="password"
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      // Click toggle button
      fireEvent.click(toggleButton)

      // Should change to type="text"
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    })

    it('should toggle confirm password field type from text back to password when clicking visibility button twice', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle confirm password visibility/i)
      const confirmPasswordInput = screen.getAllByLabelText(/password/i, {
        selector: 'input',
      })[1]

      // Click toggle button twice
      fireEvent.click(toggleButton)
      fireEvent.click(toggleButton)

      // Should be back to type="password"
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')
    })

    it('should toggle password and confirm password independently', () => {
      render(<RegistrationForm {...defaultProps} />)

      const passwordToggle = screen.getByLabelText(/toggle password visibility/i)
      const confirmPasswordToggle = screen.getByLabelText(/toggle confirm password visibility/i)
      const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i, {
        selector: 'input',
      })

      // Toggle only password field
      fireEvent.click(passwordToggle)

      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      // Toggle only confirm password field
      fireEvent.click(confirmPasswordToggle)

      expect(passwordInput).toHaveAttribute('type', 'text')
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')

      // Toggle password back
      fireEvent.click(passwordToggle)

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'text')
    })

    it('should display VisibilityOff icon when password is hidden', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle password visibility/i)
      const visibilityOffIcon = toggleButton.querySelector('svg[data-testid="VisibilityOffIcon"]')

      expect(visibilityOffIcon).toBeInTheDocument()
    })

    it('should display Visibility icon when password is visible', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle password visibility/i)

      // Click to show password
      fireEvent.click(toggleButton)

      const visibilityIcon = toggleButton.querySelector('svg[data-testid="VisibilityIcon"]')
      expect(visibilityIcon).toBeInTheDocument()
    })

    it('should display VisibilityOff icon when confirm password is hidden', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle confirm password visibility/i)
      const visibilityOffIcon = toggleButton.querySelector('svg[data-testid="VisibilityOffIcon"]')

      expect(visibilityOffIcon).toBeInTheDocument()
    })

    it('should display Visibility icon when confirm password is visible', () => {
      render(<RegistrationForm {...defaultProps} />)

      const toggleButton = screen.getByLabelText(/toggle confirm password visibility/i)

      // Click to show password
      fireEvent.click(toggleButton)

      const visibilityIcon = toggleButton.querySelector('svg[data-testid="VisibilityIcon"]')
      expect(visibilityIcon).toBeInTheDocument()
    })

    it('should preserve password value when toggling visibility', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, password: 'mySecretPassword123' },
      }
      render(<RegistrationForm {...props} />)

      const toggleButton = screen.getByLabelText(/toggle password visibility/i)
      const passwordInput = screen.getAllByLabelText(/password/i, {
        selector: 'input',
      })[0] as HTMLInputElement

      // Value before toggle
      expect(passwordInput.value).toBe('mySecretPassword123')

      // Toggle visibility
      fireEvent.click(toggleButton)

      // Value should remain the same
      expect(passwordInput.value).toBe('mySecretPassword123')

      // Toggle back
      fireEvent.click(toggleButton)

      // Value should still remain the same
      expect(passwordInput.value).toBe('mySecretPassword123')
    })

    it('should preserve confirm password value when toggling visibility', () => {
      const props = {
        ...defaultProps,
        formData: { ...defaultProps.formData, confirmPassword: 'myConfirmPassword123' },
      }
      render(<RegistrationForm {...props} />)

      const toggleButton = screen.getByLabelText(/toggle confirm password visibility/i)
      const confirmPasswordInput = screen.getAllByLabelText(/password/i, {
        selector: 'input',
      })[1] as HTMLInputElement

      // Value before toggle
      expect(confirmPasswordInput.value).toBe('myConfirmPassword123')

      // Toggle visibility
      fireEvent.click(toggleButton)

      // Value should remain the same
      expect(confirmPasswordInput.value).toBe('myConfirmPassword123')

      // Toggle back
      fireEvent.click(toggleButton)

      // Value should still remain the same
      expect(confirmPasswordInput.value).toBe('myConfirmPassword123')
    })
  })
})
