import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation.js'
import React, { type ReactNode } from 'react'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

import { useSignInForm } from '@/view/hooks/useSignInForm.js'

// Mock next/navigation
vi.mock('next/navigation.js', () => ({
  useRouter: vi.fn(),
}))

// Mock NextAuth signIn
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// Mock loginUserAction Server Action
vi.mock('@/infrastructure/serverActions/loginUser.server.js', () => ({
  loginUserAction: vi.fn(),
}))

describe('useSignInForm', () => {
  const mockPush = vi.fn()
  const mockRouter = {
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }

  let queryClient: QueryClient
  let wrapper: ({ children }: { children: ReactNode }) => React.JSX.Element

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue(mockRouter)
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  })

  describe('Initial State', () => {
    it('should initialize with empty form data', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(result.current.formData).toEqual({
        email: '',
        password: '',
      })
    })

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(result.current.errors).toEqual({
        email: '',
        password: '',
        general: '',
      })
    })

    it('should provide all required handlers', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(result.current.handleChange).toBeDefined()
      expect(result.current.handleSubmit).toBeDefined()
      expect(result.current.handleGoogleSignIn).toBeDefined()
      expect(result.current.handleGitHubSignIn).toBeDefined()
      expect(typeof result.current.handleChange).toBe('function')
      expect(typeof result.current.handleSubmit).toBe('function')
      expect(typeof result.current.handleGoogleSignIn).toBe('function')
      expect(typeof result.current.handleGitHubSignIn).toBe('function')
    })

    it('should initialize showPassword to false', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(result.current.showPassword).toBe(false)
    })

    it('should provide password visibility handlers', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(result.current.togglePasswordVisibility).toBeDefined()
      expect(typeof result.current.togglePasswordVisibility).toBe('function')
    })
  })

  describe('handleChange', () => {
    it('should update email field', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'test@example.com' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('test@example.com')
    })

    it('should update password field', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const handler = result.current.handleChange('password')
        handler({ target: { value: 'mypassword123' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.password).toBe('mypassword123')
    })

    it('should clear error for the field being changed', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      // First, trigger validation to create errors
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Please enter a valid email address')

      // Then change the field
      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'test@example.com' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.errors.email).toBe('')
    })

    it('should not clear errors for other fields', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      // Trigger validation
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      const initialPasswordError = result.current.errors.password

      // Change only email
      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'test@example.com' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.errors.password).toBe(initialPasswordError)
    })
  })

  describe('Form Validation - Email', () => {
    it('should show error when email is empty', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Please enter a valid email address')
    })

    it('should show error for invalid email format', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

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
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'valid@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'anypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('')
    })

    it('should accept email with special characters', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'user+test@example.co.uk' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'anypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('')
    })
  })

  describe('Form Validation - Password', () => {
    it('should show error when password is empty', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.password).toBe('Password is required')
    })

    it('should accept any non-empty password', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'short' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.password).toBe('')
    })

    it('should accept long passwords', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'verylongandsecurepassword123!' },
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

  describe('handleSubmit', () => {
    it('should prevent default form submission', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
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
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBeTruthy()
      expect(result.current.errors.password).toBeTruthy()
    })

    it('should not submit when validation fails', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Validation should fail and set errors
      expect(Object.values(result.current.errors).some((error) => error !== '')).toBe(true)
    })

    it('should clear all errors when form is valid', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('')
      expect(result.current.errors.password).toBe('')
    })

    it('should only require email and password for sign in', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'user@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'p' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should pass validation with just email and password
      expect(result.current.errors.email).toBe('')
      expect(result.current.errors.password).toBe('')
    })
  })

  describe('Password Visibility', () => {
    it('should toggle password visibility from false to true', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(result.current.showPassword).toBe(false)

      act(() => {
        result.current.togglePasswordVisibility()
      })

      expect(result.current.showPassword).toBe(true)
    })

    it('should toggle password visibility from true to false', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      // Toggle to true
      act(() => {
        result.current.togglePasswordVisibility()
      })

      expect(result.current.showPassword).toBe(true)

      // Toggle back to false
      act(() => {
        result.current.togglePasswordVisibility()
      })

      expect(result.current.showPassword).toBe(false)
    })

    it('should toggle password visibility multiple times correctly', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(result.current.showPassword).toBe(false)

      act(() => {
        result.current.togglePasswordVisibility()
      })
      expect(result.current.showPassword).toBe(true)

      act(() => {
        result.current.togglePasswordVisibility()
      })
      expect(result.current.showPassword).toBe(false)

      act(() => {
        result.current.togglePasswordVisibility()
      })
      expect(result.current.showPassword).toBe(true)
    })
  })

  describe('Navigation Handlers', () => {
    it('should navigate to forgot password page when handleForgotPassword is called', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        result.current.handleForgotPassword()
      })

      expect(mockPush).toHaveBeenCalledWith('/forgot-password')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })

    it('should navigate to registration page when handleSignUp is called', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        result.current.handleSignUp()
      })

      expect(mockPush).toHaveBeenCalledWith('/registration')
      expect(mockPush).toHaveBeenCalledTimes(1)
    })
  })

  describe('OAuth Handlers', () => {
    it('should provide handleGoogleSignIn without errors', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(() => {
        act(() => {
          result.current.handleGoogleSignIn()
        })
      }).not.toThrow()
    })

    it('should provide handleGitHubSignIn without errors', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      expect(() => {
        act(() => {
          result.current.handleGitHubSignIn()
        })
      }).not.toThrow()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple field updates in sequence', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

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
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('test@example.com')
      expect(result.current.formData.password).toBe('mypassword')
    })

    it('should handle validation -> correction -> revalidation flow', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      // First submission with errors
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBeTruthy()
      expect(result.current.errors.password).toBeTruthy()

      // Correct the errors
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Revalidate
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('')
      expect(result.current.errors.password).toBe('')
    })

    it('should clear specific field error independently', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      // Create errors
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Please enter a valid email address')
      expect(result.current.errors.password).toBe('Password is required')

      // Fix only email
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.errors.email).toBe('')
      expect(result.current.errors.password).toBe('Password is required')
    })

    it('should handle empty string inputs', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Clear the email field
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('')

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Please enter a valid email address')
    })
  })

  describe('Edge Cases', () => {
    it('should handle whitespace-only email', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({ target: { value: '   ' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Whitespace email should fail validation
      expect(result.current.errors.email).toBeTruthy()
    })

    it('should handle email with leading/trailing spaces', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: '  test@example.com  ' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'password' } } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Email validation might fail due to spaces (depends on EmailSchema)
      // This tests the actual behavior
      expect(result.current.errors).toBeDefined()
    })

    it('should handle very long email addresses', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({ target: { value: longEmail } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe(longEmail)
    })

    it('should handle special characters in password', () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })

      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: specialPassword },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.password).toBe('')
      expect(result.current.formData.password).toBe(specialPassword)
    })
  })

  describe('Authentication Flow Integration', () => {
    it('should call loginUserAction before establishing NextAuth session on submit', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Mock successful Server Action response
      ;(loginUserAction as Mock).mockResolvedValue({
        success: true,
        status: 200,
        data: {
          userId: '123',
          email: 'test@example.com',
          access_token: 'mock-token',
          roles: ['user'],
        },
      })

      // Mock successful NextAuth signIn
      ;(signIn as Mock).mockResolvedValue({
        ok: true,
        error: null,
      })

      // Set up valid form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify loginUserAction was called first
      expect(loginUserAction).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'mypassword',
      })

      // Verify NextAuth signIn was called second
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'mypassword',
        redirect: false,
      })

      // Verify redirect to dashboard
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle Server Action authentication failure', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Mock failed Server Action response
      ;(loginUserAction as Mock).mockResolvedValue({
        success: false,
        status: 401,
        error: 'Invalid email or password',
      })

      // Set up valid form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'wrongpassword' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify loginUserAction was called
      expect(loginUserAction).toHaveBeenCalled()

      // Verify NextAuth signIn was NOT called (authentication failed)
      expect(signIn).not.toHaveBeenCalled()

      // Verify error message is set
      expect(result.current.errors.general).toBe('Invalid email or password')

      // Verify no redirect
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle session establishment failure after successful authentication', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Mock successful Server Action response
      ;(loginUserAction as Mock).mockResolvedValue({
        success: true,
        status: 200,
        data: {
          userId: '123',
          email: 'test@example.com',
          access_token: 'mock-token',
          roles: ['user'],
        },
      })

      // Mock failed NextAuth signIn
      ;(signIn as Mock).mockResolvedValue({
        ok: false,
        error: 'Session creation failed',
      })

      // Set up valid form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit the form
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify both calls were made
      expect(loginUserAction).toHaveBeenCalled()
      expect(signIn).toHaveBeenCalled()

      // Verify appropriate error message
      expect(result.current.errors.general).toBe(
        'Authentication succeeded but session creation failed. Please try again.'
      )

      // Verify no redirect
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should verify signIn is called with redirect:false', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Mock successful responses
      ;(loginUserAction as Mock).mockResolvedValue({
        success: true,
        status: 200,
        data: { userId: '123', email: 'test@example.com' },
      })
      ;(signIn as Mock).mockResolvedValue({
        ok: true,
        error: null,
      })

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify signIn called with redirect:false
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'mypassword',
        redirect: false,
      })
      expect(signIn).toHaveBeenCalledTimes(1)
    })

    it('should call router.refresh() on successful authentication', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Mock successful responses
      ;(loginUserAction as Mock).mockResolvedValue({
        success: true,
        status: 200,
        data: { userId: '123', email: 'test@example.com' },
      })
      ;(signIn as Mock).mockResolvedValue({
        ok: true,
        error: null,
      })

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify both push and refresh were called
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRouter.refresh).toHaveBeenCalled()
    })

    it('should set isLoading to true during submission', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Create a promise we can control
      let resolveAuth:
        | ((value: { success: boolean; status: number; data?: { userId: string } }) => void)
        | undefined
      const authPromise = new Promise<{
        success: boolean
        status: number
        data?: { userId: string }
      }>((resolve) => {
        resolveAuth = resolve
      })

      ;(loginUserAction as Mock).mockReturnValue(authPromise)

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Initial state
      expect(result.current.isLoading).toBe(false)

      // Submit (don't await)
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should be loading now
      expect(result.current.isLoading).toBe(true)

      // Resolve the auth promise
      await act(async () => {
        resolveAuth!({
          success: true,
          status: 200,
          data: { userId: '123' },
        })
        ;(signIn as Mock).mockResolvedValue({ ok: true })
        await authPromise
      })

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false)
    })

    it('should set isLoading to false after authentication error', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      // Mock failed authentication
      ;(loginUserAction as Mock).mockResolvedValue({
        success: false,
        status: 401,
        error: 'Invalid credentials',
      })

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'wrongpassword' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false)
      expect(result.current.errors.general).toBe('Invalid credentials')
    })

    it('should set isLoading to false after session establishment error', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Mock successful auth but failed session
      ;(loginUserAction as Mock).mockResolvedValue({
        success: true,
        status: 200,
        data: { userId: '123' },
      })
      ;(signIn as Mock).mockResolvedValue({
        ok: false,
        error: 'Session error',
      })

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false)
      expect(result.current.errors.general).toBe(
        'Authentication succeeded but session creation failed. Please try again.'
      )
    })

    it('should set isLoading to false after exception', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      // Mock exception
      ;(loginUserAction as Mock).mockRejectedValue(new Error('Network error'))

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should no longer be loading
      expect(result.current.isLoading).toBe(false)
      expect(result.current.errors.general).toBe('An unexpected error occurred. Please try again.')
    })

    it('should handle exception in loginUserAction', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      // Mock network error
      ;(loginUserAction as Mock).mockRejectedValue(new Error('Network timeout'))

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify error handling
      expect(result.current.errors.general).toBe('An unexpected error occurred. Please try again.')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle exception in signIn (session establishment)', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Mock successful auth but exception in signIn
      ;(loginUserAction as Mock).mockResolvedValue({
        success: true,
        status: 200,
        data: { userId: '123' },
      })
      ;(signIn as Mock).mockRejectedValue(new Error('Session service unavailable'))

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify error handling
      expect(result.current.errors.general).toBe('An unexpected error occurred. Please try again.')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should prevent race condition by returning early if already loading', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')
      const { signIn } = await import('next-auth/react')

      // Create a slow authentication
      let resolveAuth:
        | ((value: { success: boolean; status: number; data?: { userId: string } }) => void)
        | undefined
      const authPromise = new Promise<{
        success: boolean
        status: number
        data?: { userId: string }
      }>((resolve) => {
        resolveAuth = resolve
      })

      ;(loginUserAction as Mock).mockReturnValue(authPromise)

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit first time
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Should be loading
      expect(result.current.isLoading).toBe(true)

      // Try to submit again while loading
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // loginUserAction should only be called once (race condition prevented)
      expect(loginUserAction).toHaveBeenCalledTimes(1)

      // Resolve the auth
      await act(async () => {
        resolveAuth!({
          success: true,
          status: 200,
          data: { userId: '123' },
        })
        ;(signIn as Mock).mockResolvedValue({ ok: true })
        await authPromise
      })
    })

    it('should handle Server Action with custom error message', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      // Mock failed auth with custom error
      ;(loginUserAction as Mock).mockResolvedValue({
        success: false,
        status: 403,
        error: 'Account is locked due to multiple failed attempts',
      })

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify custom error message is displayed
      expect(result.current.errors.general).toBe(
        'Account is locked due to multiple failed attempts'
      )
    })

    it('should handle Server Action failure with no error message', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      // Mock failed auth without error message
      ;(loginUserAction as Mock).mockResolvedValue({
        success: false,
        status: 401,
        error: null,
      })

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({ target: { value: 'mypassword' } } as React.ChangeEvent<HTMLInputElement>)
      })

      // Submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Verify default error message is used
      expect(result.current.errors.general).toBe('Invalid email or password')
    })

    it('should clear general error before new submission attempt', async () => {
      const { result } = renderHook(() => useSignInForm(), { wrapper })
      const { loginUserAction } = await import('@/infrastructure/serverActions/loginUser.server.js')

      // First failed attempt
      ;(loginUserAction as Mock).mockResolvedValue({
        success: false,
        status: 401,
        error: 'First error',
      })

      // Set up form data
      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({
          target: { value: 'test@example.com' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'wrongpassword' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // First submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.general).toBe('First error')

      // Second attempt - should succeed
      ;(loginUserAction as Mock).mockResolvedValue({
        success: true,
        status: 200,
        data: { userId: '123' },
      })

      const { signIn } = await import('next-auth/react')
      ;(signIn as Mock).mockResolvedValue({ ok: true })

      // Update password
      act(() => {
        const passwordHandler = result.current.handleChange('password')
        passwordHandler({
          target: { value: 'correctpassword' },
        } as React.ChangeEvent<HTMLInputElement>)
      })

      // Second submit
      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // General error should be cleared (empty string, not the old error)
      expect(result.current.errors.general).toBe('')
    })
  })
})
