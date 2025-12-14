import { obscured } from 'obscured'
import { useState } from 'react'

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
    const nameResult = NameSchema.safeParse(formData.name)
    if (!nameResult.success) {
      newErrors.name = nameResult.error.issues[0]?.message || 'Name is required'
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (validateForm()) {
      // Handle registration
      // TODO: Implement registration API call with obscuredData
      alert('Registration successful!')
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
    handleChange,
    handleSubmit,
    handleGoogleSignUp,
    handleGitHubSignUp,
  }
}
