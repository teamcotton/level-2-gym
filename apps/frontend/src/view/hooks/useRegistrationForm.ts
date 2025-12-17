import { obscured } from 'obscured'
import { useState } from 'react'

import { registerUser } from '@/application/actions/registerUser.js'
import { EmailSchema, NameSchema, PasswordSchema } from '@/domain/auth/index.js'

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

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value })
    // Clear error when user starts typing
    setErrors({ ...errors, [field]: '' })
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
      setIsSubmitting(true)

      try {
        const result = await registerUser(formData)

        if (result.success) {
          // Handle successful registration
          // TODO: Redirect to success page or show success message
          console.warn('Registration successful:', result.data)
        } else {
          // Handle registration error

          if (result.error === 'Email already in use') {
            setErrors((prev) => ({
              ...prev,
              email: 'This email is already registered. Please use a different email.',
            }))
            return
          }

          setErrors((prev) => ({
            ...prev,
            email: result.error || 'Registration failed',
          }))
        }
      } catch {
        setErrors((prev) => ({
          ...prev,
          email: 'An unexpected error occurred. Please try again.',
        }))
      } finally {
        setIsSubmitting(false)
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
    isSubmitting,
    handleChange,
    handleSubmit,
    handleGoogleSignUp,
    handleGitHubSignUp,
  }
}
