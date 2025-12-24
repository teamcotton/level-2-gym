'use client'

import { RegistrationForm } from '@/view/client-components/RegistrationForm.js'
import { useRegistrationForm } from '@/view/hooks/useRegistrationForm.js'

/**
 * Registration page following DDD architecture.
 * This page is minimal and declarative - it only orchestrates the hook and component.
 * Business logic is in the hook, presentation is in the component.
 */
export default function RegistrationPage() {
  const {
    errors,
    formData,
    generalError,
    handleChange,
    handleGitHubSignUp,
    handleGoogleSignUp,
    handleSubmit,
    isSubmitting,
  } = useRegistrationForm()

  return (
    <RegistrationForm
      formData={formData}
      errors={errors}
      generalError={generalError}
      onFieldChange={handleChange}
      onSubmit={handleSubmit}
      onGoogleSignUp={handleGoogleSignUp}
      onGitHubSignUp={handleGitHubSignUp}
      isSubmitting={isSubmitting}
    />
  )
}
