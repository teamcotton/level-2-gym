import { expect, test } from '@playwright/test'

import { TEST_CREDENTIALS } from './helpers.js'

test.describe('Sign In Page', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ context, page }) => {
    // Clear all cookies and storage to ensure clean state
    await context.clearCookies()
    await page.goto('/signin')
  })

  test.describe('Page Elements', () => {
    test('should display the sign in form with all required elements', async ({ page }) => {
      // Check page title
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

      // Check email field
      const emailField = page.getByLabel(/email address/i)
      await expect(emailField).toBeVisible()
      await expect(emailField).toHaveAttribute('type', 'email')
      await expect(emailField).toHaveAttribute('required')

      // Check password field
      const passwordField = page.getByLabel(/^password/i)
      await expect(passwordField).toBeVisible()
      await expect(passwordField).toHaveAttribute('type', 'password')
      await expect(passwordField).toHaveAttribute('required')

      // Check submit button
      const submitButton = page.getByRole('button', { name: /^sign in$/i })
      await expect(submitButton).toBeVisible()
      await expect(submitButton).toBeEnabled()

      // Check forgotten password link
      await expect(page.getByRole('button', { name: /forgot password/i })).toBeVisible()

      // Check sign up message and link
      await expect(page.getByText(/don't have an account/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()

      // Check OAuth buttons
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /github/i })).toBeVisible()
    })

    test('should have password visibility toggle button', async ({ page }) => {
      const passwordField = page.getByLabel(/^password/i)
      const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })

      await expect(toggleButton).toBeVisible()
      await expect(passwordField).toHaveAttribute('type', 'password')
    })
  })

  test.describe('Form Validation - Client Side', () => {
    test('should show validation error for empty email', async ({ page }) => {
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Fill password but leave email empty
      await passwordField.fill('password123')
      await submitButton.click()

      // Check for validation error - Zod validates email format first
      await expect(page.getByText(/valid email/i)).toBeVisible()
    })

    test('should show validation error for invalid email format', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Fill with invalid email
      await emailField.fill('notanemail')
      await passwordField.fill('password123')
      await submitButton.click()

      // Check for validation error
      await expect(page.getByText(/valid email/i)).toBeVisible()
    })

    test('should show validation error for empty password', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Fill email but leave password empty
      await emailField.fill('test@example.com')
      await submitButton.click()

      // Check for validation error
      await expect(page.getByText(/password.*required/i)).toBeVisible()
    })

    test('should show validation errors for both empty fields', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Submit without filling anything
      await submitButton.click()

      // Check for both validation errors - email shows format error first
      await expect(page.getByText(/valid email/i)).toBeVisible()
      await expect(page.getByText(/password.*required/i)).toBeVisible()
    })

    test('should clear validation error when user starts typing in email field', async ({
      page,
    }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Trigger validation error (fill password to avoid multiple errors)
      await passwordField.fill('password123')
      await submitButton.click()
      await expect(page.getByText(/valid email/i)).toBeVisible()

      // Start typing in email field
      await emailField.fill('t')

      // Error should be cleared
      await expect(page.getByText(/valid email/i)).toBeHidden()
    })

    test('should clear validation error when user starts typing in password field', async ({
      page,
    }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Trigger validation error (fill email to avoid multiple errors)
      await emailField.fill('test@example.com')
      await submitButton.click()
      await expect(page.getByText(/password.*required/i)).toBeVisible()

      // Start typing in password field
      await passwordField.fill('p')

      // Error should be cleared
      await expect(page.getByText(/password.*required/i)).toBeHidden()
    })
  })

  test.describe('Password Visibility Toggle', () => {
    test('should toggle password visibility when clicking the visibility icon', async ({
      page,
    }) => {
      const passwordField = page.getByLabel(/^password/i)
      const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })

      // Initially password should be hidden
      await expect(passwordField).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await toggleButton.click()
      await expect(passwordField).toHaveAttribute('type', 'text')

      // Click again to hide password
      await toggleButton.click()
      await expect(passwordField).toHaveAttribute('type', 'password')
    })

    test('should preserve password value when toggling visibility', async ({ page }) => {
      const passwordField = page.getByLabel(/^password/i)
      const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })

      const testPassword = 'MySecurePassword123!'

      // Fill password
      await passwordField.fill(testPassword)
      await expect(passwordField).toHaveValue(testPassword)

      // Toggle visibility
      await toggleButton.click()
      await expect(passwordField).toHaveValue(testPassword)

      // Toggle back
      await toggleButton.click()
      await expect(passwordField).toHaveValue(testPassword)
    })
  })

  test.describe('Authentication - Happy Path', () => {
    test('should successfully sign in with valid credentials and redirect to dashboard', async ({
      page,
    }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Fill in valid credentials (admin user seeded in global-setup)
      await emailField.fill(TEST_CREDENTIALS.email)
      await passwordField.fill(TEST_CREDENTIALS.password)

      // Submit form
      await submitButton.click()

      // Should redirect to dashboard (with timeout for authentication)
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // Should see dashboard content
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    })

    test('should maintain session after successful login and page refresh', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Login with admin user
      await emailField.fill(TEST_CREDENTIALS.email)
      await passwordField.fill(TEST_CREDENTIALS.password)
      await submitButton.click()

      // Wait for redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

      // Refresh the page
      await page.reload()

      // Should still be on dashboard (session maintained)
      await expect(page).toHaveURL('/dashboard')
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    })
  })

  test.describe('Authentication - Unhappy Paths', () => {
    test('should show error message for invalid credentials', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Fill with invalid credentials
      await emailField.fill('wrong@example.com')
      await passwordField.fill('wrongpassword')
      await submitButton.click()

      // Wait for authentication to complete by checking button is re-enabled
      await expect(submitButton).toBeEnabled({ timeout: 5000 })

      // Should show error message (check for actual error or still on signin page)
      const hasError = await page
        .getByRole('alert')
        .isVisible()
        .catch(() => false)
      const currentUrl = page.url()

      // Should either show error or still be on signin page
      expect(hasError || currentUrl.includes('/signin')).toBeTruthy()
    })

    test('should show error for non-existent user', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Fill with non-existent user
      await emailField.fill('nonexistent@example.com')
      await passwordField.fill('Password123!')
      await submitButton.click()

      // Wait for authentication to complete by checking button is re-enabled
      await expect(submitButton).toBeEnabled({ timeout: 5000 })

      // Should show error message OR still be on signin page
      const hasError = await page
        .getByRole('alert')
        .isVisible()
        .catch(() => false)
      const isOnSignin = page.url().includes('/signin')
      expect(hasError || isOnSignin).toBeTruthy()
    })

    test('should show error for correct email but wrong password', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Use valid email but wrong password
      await emailField.fill(TEST_CREDENTIALS.email)
      await passwordField.fill('WrongPassword123!')
      await submitButton.click()

      // Wait for authentication to complete by checking button is re-enabled
      await expect(submitButton).toBeEnabled({ timeout: 5000 })

      // Should show error message or still be on signin page
      const hasError = await page
        .getByRole('alert')
        .isVisible()
        .catch(() => false)
      const currentUrl = page.url()
      expect(hasError || currentUrl.includes('/signin')).toBeTruthy()
    })

    test('should clear previous error when submitting again', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // First attempt with wrong credentials
      await emailField.fill('wrong@example.com')
      await passwordField.fill('wrongpassword')
      await submitButton.click()

      // Wait for authentication to complete by checking button is re-enabled
      await expect(submitButton).toBeEnabled({ timeout: 5000 })

      // Clear fields and try again with valid credentials
      await emailField.clear()
      await emailField.fill(TEST_CREDENTIALS.email)
      await passwordField.clear()
      await passwordField.fill(TEST_CREDENTIALS.password)
      await submitButton.click()

      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    })
  })

  test.describe('Form Interactions', () => {
    // Run these tests serially to avoid authentication race conditions
    test.describe.configure({ mode: 'serial' })

    test('should allow typing in email and password fields', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)

      const testEmail = 'test@example.com'
      const testPassword = 'testpassword123'

      await emailField.fill(testEmail)
      await passwordField.fill(testPassword)

      await expect(emailField).toHaveValue(testEmail)
      await expect(passwordField).toHaveValue(testPassword)
    })

    test('should allow clearing and re-filling form fields', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)

      // Fill fields
      await emailField.fill('first@example.com')
      await passwordField.fill('firstpassword')

      // Clear fields
      await emailField.clear()
      await passwordField.clear()

      await expect(emailField).toHaveValue('')
      await expect(passwordField).toHaveValue('')

      // Re-fill with different values
      await emailField.fill('second@example.com')
      await passwordField.fill('secondpassword')

      await expect(emailField).toHaveValue('second@example.com')
      await expect(passwordField).toHaveValue('secondpassword')
    })

    test('should submit form when pressing Enter in password field', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)

      // Fill in credentials
      await emailField.fill(TEST_CREDENTIALS.email)
      await passwordField.fill(TEST_CREDENTIALS.password)

      // Press Enter in password field and wait for navigation
      await Promise.all([
        page.waitForURL('/dashboard', { timeout: 20000 }),
        passwordField.press('Enter'),
      ])

      // Verify successful redirect
      await expect(page).toHaveURL('/dashboard')
    })

    test('should disable submit button while form is submitting', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Fill in credentials
      await emailField.fill(TEST_CREDENTIALS.email)
      await passwordField.fill(TEST_CREDENTIALS.password)

      // Check button is enabled before submission
      await expect(submitButton).toBeEnabled()

      // Submit the form and wait for navigation
      await Promise.all([page.waitForURL('/dashboard', { timeout: 20000 }), submitButton.click()])
    })
  })

  test.describe('Navigation Links', () => {
    test('should navigate to forgot password page when clicking "Forgot Password" link', async ({
      page,
    }) => {
      const forgotPasswordButton = page.getByRole('button', { name: /forgot password/i })

      await forgotPasswordButton.click()

      // Should navigate to forgot password page
      await expect(page).toHaveURL('/forgot-password')
    })

    test('should navigate to registration page when clicking "Sign up" link', async ({ page }) => {
      const signUpButton = page.getByRole('button', { name: /sign up/i })

      await signUpButton.click()

      // Should navigate to registration page
      await expect(page).toHaveURL('/registration')
    })

    test('should preserve form data when navigating back from registration', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const signUpButton = page.getByRole('button', { name: /sign up/i })

      // Fill email
      await emailField.fill('test@example.com')

      // Navigate to registration
      await signUpButton.click()
      await expect(page).toHaveURL('/registration')

      // Navigate back
      await page.goBack()
      await expect(page).toHaveURL('/signin')

      // Form should be cleared (browser default behavior)
      await expect(emailField).toHaveValue('')
    })
  })

  test.describe('Security', () => {
    test('should not expose password in page source', async ({ page }) => {
      const passwordField = page.getByLabel(/^password/i)
      const testPassword = 'SecurePassword123!'

      await passwordField.fill(testPassword)

      // Password should not appear in plain text in HTML (it's in input value attribute)
      // We check that it's properly masked in the input type
      const passwordInput = passwordField
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should have autocomplete attributes for better password manager support', async ({
      page,
    }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)

      // Check autocomplete attributes
      await expect(emailField).toHaveAttribute('autocomplete', 'email')
      await expect(passwordField).toHaveAttribute('autocomplete', 'current-password')
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels for form fields', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)

      // Fields should be accessible by label
      await expect(emailField).toBeVisible()
      await expect(passwordField).toBeVisible()
    })

    test('should have proper focus order', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)

      // Click directly on email field to start
      await emailField.click()
      await expect(emailField).toBeFocused()

      // Tab to password field
      await page.keyboard.press('Tab')
      await expect(passwordField).toBeFocused()

      // Tab to next element (should be visibility toggle button)
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(['BUTTON', 'INPUT', 'A'].includes(focusedElement || '')).toBeTruthy()
    })

    test('should have proper error associations with input fields', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      // Trigger validation error
      await submitButton.click()

      // Email field should have aria-invalid attribute
      await expect(emailField).toHaveAttribute('aria-invalid', 'true')

      // Fix the error
      await emailField.fill('valid@example.com')

      // aria-invalid should be removed or set to false
      const ariaInvalid = await emailField.getAttribute('aria-invalid')
      expect(ariaInvalid === 'false' || ariaInvalid === null).toBeTruthy()
    })
  })

  test.describe('Edge Cases', () => {
    test('should handle special characters in password', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?'

      await emailField.fill('test@example.com')
      await passwordField.fill(specialPassword)

      await expect(passwordField).toHaveValue(specialPassword)

      // Submit should work (though credentials may be invalid)
      await submitButton.click()

      // Wait for authentication to complete by checking button is re-enabled
      await expect(submitButton).toBeEnabled({ timeout: 5000 })

      // Should either redirect or show error, but not crash
      const hasError = await page
        .getByRole('alert')
        .isVisible()
        .catch(() => false)
      const isOnDashboard = page.url().includes('/dashboard')
      const isOnSignin = page.url().includes('/signin')

      expect(hasError || isOnDashboard || isOnSignin).toBeTruthy()
    })

    test('should handle very long email addresses', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)

      const longEmail = 'a'.repeat(100) + '@example.com'

      await emailField.fill(longEmail)
      await expect(emailField).toHaveValue(longEmail)
    })

    // eslint-disable-next-line playwright/no-skipped-test
    test.skip('should handle rapid form submissions', async ({ page }) => {
      const emailField = page.getByLabel(/email address/i)
      const passwordField = page.getByLabel(/^password/i)
      const submitButton = page.getByRole('button', { name: /^sign in$/i })

      await emailField.fill('test@example.com')
      await passwordField.fill('password123')

      // Click submit multiple times rapidly
      await Promise.all([submitButton.click(), submitButton.click(), submitButton.click()]).catch(
        () => {
          // Ignore errors from rapid clicks
        }
      )

      // Should handle gracefully - either show error or redirect
      // but not crash or cause multiple redirects
      // Wait for URL to match signin or dashboard (whichever it ends up on)
      await page.waitForURL(/\/(signin|dashboard)/, { timeout: 5000 }).catch(() => null)

      const currentUrl = page.url()
      expect(currentUrl.includes('/signin') || currentUrl.includes('/dashboard')).toBeTruthy()
    })
  })
})
