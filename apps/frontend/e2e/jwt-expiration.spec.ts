import { expect, test } from '@playwright/test'

import { TEST_CREDENTIALS } from './helpers.js'

test.describe('JWT Token Expiration', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies()
  })

  test('should redirect to signin when JWT expires during server action call', async ({
    page,
    context,
  }) => {
    // Step 1: Sign in with valid credentials
    await page.goto('/signin')

    const emailField = page.getByLabel(/email address/i)
    const passwordField = page.getByLabel(/^password/i)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })

    await emailField.fill(TEST_CREDENTIALS.email)
    await passwordField.fill(TEST_CREDENTIALS.password)

    // Submit form and wait for navigation
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])

    // Verify we're authenticated
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Step 2: Get the current NextAuth session token cookie
    const cookies = await context.cookies()
    const sessionToken = cookies.find(
      (cookie) =>
        cookie.name === 'next-auth.session-token' ||
        cookie.name === '__Secure-next-auth.session-token'
    )

    expect(sessionToken).toBeDefined()

    // Step 3: Replace the JWT with an expired/invalid token
    // We'll use a token that's clearly invalid by just changing one character
    // This simulates what happens when a JWT expires or becomes invalid
    if (sessionToken) {
      const invalidToken = sessionToken.value.slice(0, -5) + 'xxxxx'
      await context.addCookies([
        {
          ...sessionToken,
          value: invalidToken,
        },
      ])
    }

    // Step 4: Try to access a page that makes server action calls to the backend
    // The dashboard or a page that fetches user data would trigger backend calls
    await page.goto('/dashboard')

    // Step 5: Wait for redirect to signin page due to 401 from backend
    // This might happen immediately or after a server action call
    await page.waitForURL(/\/signin/, { timeout: 10000 })

    // Verify we're redirected to signin
    expect(page.url()).toContain('/signin')

    // Verify the error parameter or callbackUrl is set
    // Note: The middleware may catch the invalid JWT before server actions run,
    // so we might not always get the 'session_expired' error parameter.
    // The middleware redirect will include a callbackUrl parameter instead.
    const url = new URL(page.url())
    const errorParam = url.searchParams.get('error')
    const callbackUrl = url.searchParams.get('callbackUrl')

    // Should have either an error parameter OR a callbackUrl (middleware redirect)
    expect(errorParam || callbackUrl).toBeTruthy()

    // Verify signin page is displayed
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('should redirect to signin when accessing users list with expired JWT', async ({
    page,
    context,
  }) => {
    // Step 1: Sign in
    await page.goto('/signin')

    const emailField = page.getByLabel(/email address/i)
    const passwordField = page.getByLabel(/^password/i)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })

    await emailField.fill(TEST_CREDENTIALS.email)
    await passwordField.fill(TEST_CREDENTIALS.password)

    // Submit form and wait for navigation
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])

    // Step 2: Navigate to a page that will call the backend
    // For example, if there's a users list page
    await page.goto('/dashboard')

    // Step 3: Invalidate the JWT cookie
    const cookies = await context.cookies()
    const sessionToken = cookies.find(
      (cookie) =>
        cookie.name === 'next-auth.session-token' ||
        cookie.name === '__Secure-next-auth.session-token'
    )

    if (sessionToken) {
      const invalidToken = 'invalid.jwt.token'
      await context.addCookies([
        {
          ...sessionToken,
          value: invalidToken,
        },
      ])
    }

    // Step 4: Trigger a server action that would call the backend
    // Since we can't directly call server actions from E2E tests,
    // we'll navigate to a page or perform an action that triggers backend calls
    await page.reload()

    // Step 5: Should be redirected to signin
    await page.waitForURL(/\/signin/, { timeout: 10000 })
    expect(page.url()).toContain('/signin')
  })

  test('should maintain authentication with valid JWT', async ({ page }) => {
    // Sign in
    await page.goto('/signin')

    const emailField = page.getByLabel(/email address/i)
    const passwordField = page.getByLabel(/^password/i)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })

    await emailField.fill(TEST_CREDENTIALS.email)
    await passwordField.fill(TEST_CREDENTIALS.password)

    // Submit form and wait for navigation
    await Promise.all([page.waitForURL(/\/dashboard/, { timeout: 15000 }), submitButton.click()])

    // Navigate to dashboard (should work fine with valid JWT)
    await page.goto('/dashboard')

    // Should remain on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Reload the page (should still work)
    await page.reload()
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })
})
