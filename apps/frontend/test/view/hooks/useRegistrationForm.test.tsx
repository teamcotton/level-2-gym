import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registerUser } from '@/application/actions/registerUser.js'
import { useRegistrationForm } from '@/view/hooks/useRegistrationForm.js'

// Mock the registerUser action
vi.mock('@/application/actions/registerUser.js', () => ({
  registerUser: vi.fn(),
}))

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation.js', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useRegistrationForm', () => {
  beforeEach(() => {
    vi.mocked(registerUser).mockReset()
    mockPush.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })
  describe('Initial State', () => {
    it('should initialize with empty form data', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      expect(result.current.formData).toEqual({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
      })
    })

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      expect(result.current.errors).toEqual({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
      })
    })

    it('should provide all required handlers', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      expect(result.current.handleChange).toBeDefined()
      expect(result.current.handleSubmit).toBeDefined()
      expect(result.current.handleGoogleSignUp).toBeDefined()
      expect(typeof result.current.handleChange).toBe('function')
      expect(typeof result.current.handleSubmit).toBe('function')
      expect(typeof result.current.handleGoogleSignUp).toBe('function')
    })
  })

  describe('handleChange', () => {
    it('should update email field', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'test@example.com' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('test@example.com')
    })

    it('should update name field', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const handler = result.current.handleChange('name')
        handler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.name).toBe('John Doe')
    })

    it('should update password field', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const handler = result.current.handleChange('password')
        handler({ target: { value: 'securepassword123' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.password).toBe('securepassword123')
    })

    it('should update confirmPassword field', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const handler = result.current.handleChange('confirmPassword')
        handler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.confirmPassword).toBe('securepassword123')
    })

    it('should clear error for the field being changed', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      // First, trigger validation to create errors
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Email is required')

      // Then change the field
      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'test@example.com' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.errors.email).toBe('')
    })

    it('should not clear errors for other fields', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      // Trigger validation
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      const initialNameError = result.current.errors.name

      // Change only email
      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'test@example.com' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.errors.name).toBe(initialNameError)
    })
  })

  describe('Form Validation - Email', () => {
    it('should show error when email is empty', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Email is required')
    })

    it('should show error for invalid email format', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'invalid-email' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Please enter a valid email address')
    })

    it('should accept valid email', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'valid@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('')
    })
  })

  describe('Form Validation - Name', () => {
    it('should show error when name is empty', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.name).toBeTruthy()
    })

    it('should show error when name is less than 2 characters', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const handler = result.current.handleChange('name')
        handler({ target: { value: 'A' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.name).toBe('Name must be at least 2 characters')
    })

    it('should show error when name exceeds 100 characters', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      const longName = 'A'.repeat(101)

      act(() => {
        const handler = result.current.handleChange('name')
        handler({ target: { value: longName } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.name).toBe('Name must not exceed 100 characters')
    })

    it('should accept valid name with exactly 2 characters', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'AB' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.name).toBe('')
    })

    it('should accept valid name with exactly 100 characters', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      const maxLengthName = 'A'.repeat(100)

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: maxLengthName } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.name).toBe('')
    })

    it('should accept valid name', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.name).toBe('')
    })
  })

  describe('Form Validation - Password', () => {
    it('should show error when password is empty', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.password).toBe('Password is required')
    })

    it('should show error when password is less than 12 characters', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const handler = result.current.handleChange('password')
        handler({ target: { value: 'short' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.password).toBe('Password must be at least 12 characters')
    })

    it('should accept password with 12 or more characters', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.password).toBe('')
    })
  })

  describe('Form Validation - Confirm Password', () => {
    it('should show error when confirm password is empty', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.confirmPassword).toBe('Please confirm your password')
    })

    it('should show error when passwords do not match', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)

        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'differentpassword' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.confirmPassword).toBe('Passwords do not match')
    })

    it('should not show error when passwords match', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.confirmPassword).toBe('')
    })
  })

  describe('handleSubmit', () => {
    it('should prevent default form submission', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })
      let defaultPrevented = false

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {
            defaultPrevented = true
          },
        } as React.FormEvent)
      })

      expect(defaultPrevented).toBe(true)
    })

    it('should validate form on submission', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBeTruthy()
      expect(result.current.errors.name).toBeTruthy()
      expect(result.current.errors.password).toBeTruthy()
      expect(result.current.errors.confirmPassword).toBeTruthy()
    })

    it('should not submit when validation fails', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Validation should fail and set errors
      expect(Object.values(result.current.errors).some((error) => error !== '')).toBe(true)
    })

    it('should clear all errors when form is valid', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('')
      expect(result.current.errors.name).toBe('')
      expect(result.current.errors.password).toBe('')
      expect(result.current.errors.confirmPassword).toBe('')
    })
  })

  describe('OAuth Handlers', () => {
    it('should provide handleGoogleSignUp without errors', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      expect(() => {
        act(() => {
          result.current.handleGoogleSignUp()
        })
      }).not.toThrow()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple field updates in sequence', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'first@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('first@example.com')

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'second@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('second@example.com')
    })

    it('should maintain other field values when updating one field', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('test@example.com')
      expect(result.current.formData.name).toBe('John Doe')
      expect(result.current.formData.password).toBe('securepassword123')
    })

    it('should handle validation -> correction -> revalidation flow', () => {
      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      // First submission with errors
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBeTruthy()

      // Correct the errors
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Revalidate
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('')
      expect(result.current.errors.name).toBe('')
      expect(result.current.errors.password).toBe('')
      expect(result.current.errors.confirmPassword).toBe('')
    })
  })

  describe('Error Handling - Early Return Behavior', () => {
    it('should set specific email error and return early for "Email already in use" without setting generic error', async () => {
      // Mock registerUser to return "Email already in use" error
      vi.mocked(registerUser).mockResolvedValue({
        status: 409,
        success: false,
        error: 'Email already in use',
      })

      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      // Fill in valid form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'existing@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should set the specific "already registered" error message
      expect(result.current.errors.email).toBe(
        'This email is already registered. Please use a different email.'
      )

      // Should NOT have set the generic "Registration failed" message
      // This verifies the early return prevents the fallback error
      expect(result.current.errors.email).not.toBe('Registration failed')
      expect(result.current.errors.email).not.toBe('Email already in use')
    })

    it('should set generic error for other registration failures (not "Email already in use")', async () => {
      // Mock registerUser to return a different error
      vi.mocked(registerUser).mockResolvedValue({
        status: 500,
        success: false,
        error: 'Server error occurred',
      })

      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      // Fill in valid form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should set the server error message in generalError (not errors.email)
      expect(result.current.generalError).toBe('Server error occurred')
      expect(result.current.errors.email).toBe('')
    })

    it('should set fallback "Registration failed" when error message is undefined', async () => {
      // Mock registerUser to return success: false with no error message
      vi.mocked(registerUser).mockResolvedValue({
        status: 500,
        success: false,
        error: undefined,
      })

      const { result } = renderHook(() => useRegistrationForm(), { wrapper: createWrapper() })

      // Fill in valid form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const nameHandler = result.current.handleChange('name')
        nameHandler({ target: { value: 'John Doe' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const confirmHandler = result.current.handleChange('confirmPassword')
        confirmHandler({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should set the fallback "Registration failed" message in generalError
      expect(result.current.generalError).toBe('Registration failed. Please try again.')
      expect(result.current.errors.email).toBe('')
    })
  })

  describe('QueryClient Integration (Approach #4)', () => {
    it('should invalidate users query on successful registration', async () => {
      // Create a real QueryClient instance
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      // Spy on the invalidateQueries method BEFORE creating the hook
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Mock successful registration
      vi.mocked(registerUser).mockResolvedValue({
        status: 201,
        success: true,
        data: { userId: '123', access_token: 'string', token_type: 'Bearer', expires_in: 3600 },
      })

      // Wrap the hook with QueryClientProvider
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useRegistrationForm(), { wrapper })

      // Fill in valid form data using individual act blocks
      act(() => {
        result.current.handleChange('email')({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleChange('name')({
          target: { value: 'John Doe' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleChange('password')({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleChange('confirmPassword')({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify registerUser was called
      expect(vi.mocked(registerUser)).toHaveBeenCalled()

      // Verify that invalidateQueries was called
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['users'] })
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(1)
    })

    it('should not invalidate queries on failed registration', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      // Mock failed registration
      vi.mocked(registerUser).mockResolvedValue({
        status: 400,
        success: false,
        error: 'Registration failed',
      })

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useRegistrationForm(), { wrapper })

      // Fill in valid form data
      act(() => {
        result.current.handleChange('email')({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
        result.current.handleChange('name')({
          target: { value: 'John Doe' },
        } as React.ChangeEvent<HTMLInputElement>)
        result.current.handleChange('password')({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
        result.current.handleChange('confirmPassword')({
          target: { value: 'securepassword123' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify that invalidateQueries was NOT called on failure
      expect(invalidateQueriesSpy).not.toHaveBeenCalled()
    })

    it('should not invalidate queries when validation fails', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      )

      const { result } = renderHook(() => useRegistrationForm(), { wrapper })

      // Submit without filling form (validation will fail)
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify that invalidateQueries was NOT called when form is invalid
      expect(invalidateQueriesSpy).not.toHaveBeenCalled()
      // registerUser should not have been called either
      expect(registerUser).not.toHaveBeenCalled()
    })
  })
})
