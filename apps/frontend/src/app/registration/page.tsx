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
    handleSignIn,
    handleSubmit,
    isSubmitting,
    showConfirmPassword,
    showPassword,
    toggleConfirmPasswordVisibility,
    togglePasswordVisibility,
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
      onSignIn={handleSignIn}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      togglePasswordVisibility={togglePasswordVisibility}
      toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
      isSubmitting={isSubmitting}
    />
  )
}
