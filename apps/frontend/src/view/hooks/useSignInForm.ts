import type { LoginDTO } from '@level-2-gym/shared'
import { LoginSchema } from '@level-2-gym/shared'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation.js'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

type FormData = LoginDTO

interface FormErrors {
  email: string
  password: string
  general: string
}

export function useSignInForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  })

  const [errors, setErrors] = useState<FormErrors>({
    email: '',
    password: '',
    general: '',
  })

  // TanStack Query mutation wrapping NextAuth signIn
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginDTO) => {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })
      return result
    },
    onSuccess: (result) => {
      if (result?.ok) {
        // Clear any previous general error on successful login
        setErrors((prev) => ({
          ...prev,
          general: '',
        }))
        // Token is automatically stored in NextAuth session
        // Redirect to dashboard on successful login
        router.push('/dashboard')
      } else {
        // Handle authentication error - show as general error
        setErrors((prev) => ({
          ...prev,
          general: result?.error || 'Invalid email or password',
        }))
      }
    },
    onError: (error: Error) => {
      // Handle unexpected errors (network, server unavailable, etc.) - show as general error
      setErrors((prev) => ({
        ...prev,
        general: error.message || 'An unexpected error occurred. Please try again.',
      }))
    },
  })

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
    // Clear field-specific error when user starts typing
    // Note: general errors are preserved during field changes and are reset by validateForm on submit
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: '',
      password: '',
      general: '',
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
      // Call login API using TanStack Query mutation
      loginMutation.mutate(formData)
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
    isLoading: loginMutation.isPending,
    isError: loginMutation.isError,
  }
}
