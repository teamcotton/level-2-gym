import type { LoginDTO } from '@level-2-gym/shared'
import { LoginSchema } from '@level-2-gym/shared'
import { useState } from 'react'

type FormData = LoginDTO

interface FormErrors {
  email: string
  password: string
}

export function useSignInForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
  })

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value })
    // Clear error when user starts typing
    setErrors({ ...errors, [field]: '' })
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: '',
      password: '',
    }

    // Validate entire form using shared LoginSchema
    const parsed = LoginSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>
      newErrors.email = fieldErrors.email?.[0] ?? ''
      newErrors.password = fieldErrors.password?.[0] ?? ''
    }

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === '')
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (validateForm()) {
      // Handle sign in
      // TODO: Implement sign in API call
    }
  }

  const handleGoogleSignIn = () => {
    // Handle Google OAuth
    // TODO: Implement Google OAuth
  }

  const handleGitHubSignIn = () => {
    // Handle GitHub OAuth
    // TODO: Implement GitHub OAuth
  }

  return {
    formData,
    errors,
    handleChange,
    handleSubmit,
    handleGoogleSignIn,
    handleGitHubSignIn,
  }
}
