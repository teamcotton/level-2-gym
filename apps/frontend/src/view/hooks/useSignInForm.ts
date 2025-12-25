import type { LoginDTO } from '@level-2-gym/shared'
import { LoginSchema } from '@level-2-gym/shared'
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

  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      email: '',
      password: '',
      general: '',
    }

    const parsed = LoginSchema.safeParse(formData)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[] | undefined>
      newErrors.email = fieldErrors.email?.[0] ?? ''
      newErrors.password = fieldErrors.password?.[0] ?? ''
    }

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === '')
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors((prev) => ({ ...prev, general: '' }))

    try {
      console.log('[useSignInForm] Calling NextAuth signIn')

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      console.log('[useSignInForm] Result:', result)

      if (result?.error) {
        console.error('[useSignInForm] Error:', result.error)
        setErrors((prev) => ({
          ...prev,
          general: result.error || 'Invalid email or password',
        }))
      } else if (result?.ok) {
        console.log('[useSignInForm] Success - redirecting')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      console.error('[useSignInForm] Exception:', error)
      setErrors((prev) => ({
        ...prev,
        general: 'An unexpected error occurred. Please try again.',
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    // TODO: Implement Google OAuth
  }

  const handleGitHubSignIn = () => {
    // TODO: Implement GitHub OAuth
  }

  const handleForgotPassword = () => {
    router.push('/forgot-password')
  }

  const handleSignUp = () => {
    router.push('/registration')
  }

  return {
    formData,
    errors,
    handleChange,
    handleSubmit,
    handleGoogleSignIn,
    handleGitHubSignIn,
    handleForgotPassword,
    handleSignUp,
    showPassword,
    togglePasswordVisibility,
    isLoading,
    isError: false,
  }
}
