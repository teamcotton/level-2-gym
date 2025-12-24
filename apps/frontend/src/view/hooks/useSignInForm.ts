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
        // Token is automatically stored in NextAuth session
        // Redirect to dashboard on successful login
        router.push('/dashboard')
      } else {
        // Handle authentication error
        setErrors((prev) => ({
          ...prev,
          password: result?.error || 'Invalid email or password',
        }))
      }
    },
    onError: (error: Error) => {
      // Handle unexpected errors
      setErrors((prev) => ({
        ...prev,
        password: error.message || 'An unexpected error occurred',
      }))
    },
  })

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [field]: '' }))
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
