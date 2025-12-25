import type { LoginDTO } from '@level-2-gym/shared'
import { LoginSchema } from '@level-2-gym/shared'
import { useRouter } from 'next/navigation.js'
import { signIn } from 'next-auth/react'
import { useState } from 'react'

import { createLogger } from '@/adapters/secondary/services/logger.service.js'
import { loginUserAction } from '@/infrastructure/serverActions/loginUser.server.js'

const logger = createLogger({ prefix: '[useSignInForm]' })

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

    // Prevent race condition: return early if already processing
    if (isLoading) {
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors((prev) => ({ ...prev, general: '' }))

    try {
      logger.info('[useSignInForm] Calling Server Action for authentication')

      // Step 1: Authenticate via Server Action (secure server-side call to backend)
      const authResult = await loginUserAction({
        email: formData.email,
        password: formData.password,
      })

      logger.info('[useSignInForm] Server Action result:', {
        success: authResult.success,
        status: authResult.status,
      })

      if (!authResult.success) {
        logger.error('[useSignInForm] Authentication failed:', authResult.error)
        setErrors((prev) => ({
          ...prev,
          general: authResult.error || 'Invalid email or password',
        }))
        return
      }

      // Step 2: Establish NextAuth session after successful authentication
      // Note: This makes a second call to the backend through NextAuth's authorize function.
      // This is a known trade-off to maintain NextAuth's session management while keeping
      // authentication logic explicit in the infrastructure layer (Server Action).
      // Alternative approaches (custom session management or modifying NextAuth's flow)
      // would be more complex and outside the scope of this security architecture improvement.
      logger.info('[useSignInForm] Authentication successful, establishing session')
      const sessionResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (sessionResult?.error) {
        logger.error('[useSignInForm] Session establishment failed:', sessionResult.error)
        setErrors((prev) => ({
          ...prev,
          general: 'Authentication succeeded but session creation failed. Please try again.',
        }))
        return
      }

      if (sessionResult?.ok) {
        logger.info('[useSignInForm] Success - redirecting to dashboard')
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      logger.error('[useSignInForm] Exception:', error)
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
  }
}
