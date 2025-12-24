import { obscured } from 'obscured'
import { useState } from 'react'

import { EmailSchema, NameSchema, PasswordSchema } from '@/domain/auth/index.js'
import { useRegisterUser } from '@/view/hooks/queries/useRegisterUser.js'

interface FormData extends Record<string, string> {
  email: string
  name: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  email: string
  name: string
  password: string
  confirmPassword: string
}

export function useRegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  })

  const [generalError, setGeneralError] = useState<string>('')
  const mutation = useRegisterUser()

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value })
    // Clear errors when user starts typing
    setErrors({ ...errors, [field]: '' })
    setGeneralError('')
  }

  const validateForm = (): boolean => {
    // Obscure sensitive fields before validation
    const obscuredData = obscured.obscureKeys(formData, ['password', 'confirmPassword'])

    const newErrors: FormErrors = {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else {
      const result = EmailSchema.safeParse(formData.email)
      if (!result.success) {
        newErrors.email = result.error.issues[0]?.message || 'Please enter a valid email address'
      }
    }

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Name is required'
    } else {
      const nameResult = NameSchema.safeParse(formData.name)
      if (!nameResult.success) {
        newErrors.name = nameResult.error.issues[0]?.message || 'Invalid name'
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const result = PasswordSchema.safeParse(obscured.value(obscuredData.password))
      if (!result.success) {
        newErrors.password =
          result.error.issues[0]?.message || 'Password must be at least 12 characters'
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (
      obscured.value(obscuredData.password) !== obscured.value(obscuredData.confirmPassword)
    ) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === '')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (validateForm()) {
      setGeneralError('')

      try {
        const result = await mutation.mutateAsync(formData)

        if (result.success) {
          // Handle successful registration
          // TODO: Redirect to admin
          console.warn('Registration successful:', result.data)
        } else {
          // Handle registration error

          // Check if error is about duplicate email (handles both backend messages)
          if (result.status === 409) {
            setErrors((prev) => ({
              ...prev,
              email: 'This email is already registered. Please use a different email.',
            }))
            return
          }

          // Backend connection errors should appear in alert
          if (result.status === 503) {
            setGeneralError(result.error || 'Service unavailable. Please try again later.')
            return
          }

          // Other registration failures should appear in alert
          setGeneralError(result.error || 'Registration failed. Please try again.')
        }
      } catch (e) {
        // If mutation throws an unexpected error, surface generic message
        setGeneralError(
          e instanceof Error ? e.message : 'An unexpected error occurred. Please try again.'
        )
      }
    }
  }

  const handleGoogleSignUp = () => {
    // Handle Google OAuth
    // TODO: Implement Google OAuth
  }

  const handleGitHubSignUp = () => {
    // Handle GitHub OAuth
    // TODO: Implement GitHub OAuth
  }

  return {
    formData,
    errors,
    generalError,
    isSubmitting: mutation.isPending,
    handleChange,
    handleSubmit,
    handleGoogleSignUp,
    handleGitHubSignUp,
  }
}
