'use client'

import { SignInForm } from '@/view/client-components/SignInForm.js'
import { useSignInForm } from '@/view/hooks/useSignInForm.js'

/**
 * Sign-in page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export default function SignInPage() {
  const { errors, formData, handleChange, handleGitHubSignIn, handleGoogleSignIn, handleSubmit } =
    useSignInForm()

  return (
    <SignInForm
      formData={formData}
      errors={errors}
      onFieldChange={handleChange}
      onSubmit={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onGitHubSignIn={handleGitHubSignIn}
    />
  )
}
