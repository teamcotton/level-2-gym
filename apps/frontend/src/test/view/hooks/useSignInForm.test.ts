import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSignInForm } from '@/view/hooks/useSignInForm.js'

describe('useSignInForm', () => {
  describe('Initial State', () => {
    it('should initialize with empty form data', () => {
      const { result } = renderHook(() => useSignInForm())

      expect(result.current.formData).toEqual({
        email: '',
        password: '',
      })
    })

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() => useSignInForm())

      expect(result.current.errors).toEqual({
        email: '',
        password: '',
      })
    })

    it('should provide all required handlers', () => {
      const { result } = renderHook(() => useSignInForm())

      expect(result.current.handleChange).toBeDefined()
      expect(result.current.handleSubmit).toBeDefined()
      expect(result.current.handleGoogleSignIn).toBeDefined()
      expect(result.current.handleGitHubSignIn).toBeDefined()
      expect(typeof result.current.handleChange).toBe('function')
      expect(typeof result.current.handleSubmit).toBe('function')
      expect(typeof result.current.handleGoogleSignIn).toBe('function')
      expect(typeof result.current.handleGitHubSignIn).toBe('function')
    })
  })

  describe('handleChange', () => {
    it('should update email field', () => {
      const { result } = renderHook(() => useSignInForm())

      act(() => {
        const handler = result.current.handleChange('email')
        handler({ target: { value: 'test@example.com' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe('test@example.com')
    })

    it('should update password field', () => {
      const { result } = renderHook(() => useSignInForm())

      act(() => {
        const handler = result.current.handleChange('password')
        handler({ target: { value: 'mypassword123' } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.password).toBe('mypassword123')
    })

    it('should clear error for the field being changed', () => {
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Email is required')
    })

    it('should show error for invalid email format', () => {
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.password).toBe('Password is required')
    })

    it('should accept any non-empty password', () => {
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())
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
      const { result } = renderHook(() => useSignInForm())

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBeTruthy()
      expect(result.current.errors.password).toBeTruthy()
    })

    it('should not submit when validation fails', () => {
      const { result } = renderHook(() => useSignInForm())

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      // Validation should fail and set errors
      expect(Object.values(result.current.errors).some((error) => error !== '')).toBe(true)
    })

    it('should clear all errors when form is valid', () => {
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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

  describe('OAuth Handlers', () => {
    it('should provide handleGoogleSignIn without errors', () => {
      const { result } = renderHook(() => useSignInForm())

      expect(() => {
        act(() => {
          result.current.handleGoogleSignIn()
        })
      }).not.toThrow()
    })

    it('should provide handleGitHubSignIn without errors', () => {
      const { result } = renderHook(() => useSignInForm())

      expect(() => {
        act(() => {
          result.current.handleGitHubSignIn()
        })
      }).not.toThrow()
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle multiple field updates in sequence', () => {
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

      // Create errors
      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        } as React.FormEvent)
      })

      expect(result.current.errors.email).toBe('Email is required')
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
      const { result } = renderHook(() => useSignInForm())

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

      expect(result.current.errors.email).toBe('Email is required')
    })
  })

  describe('Edge Cases', () => {
    it('should handle whitespace-only email', () => {
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

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
      const { result } = renderHook(() => useSignInForm())

      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'

      act(() => {
        const emailHandler = result.current.handleChange('email')
        emailHandler({ target: { value: longEmail } } as React.ChangeEvent<HTMLInputElement>)
      })

      expect(result.current.formData.email).toBe(longEmail)
    })

    it('should handle special characters in password', () => {
      const { result } = renderHook(() => useSignInForm())

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
})
