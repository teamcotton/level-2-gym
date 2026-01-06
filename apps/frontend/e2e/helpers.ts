import { type BrowserContext, expect, type Page } from '@playwright/test'

/**
 * Test credentials for E2E tests
 * These credentials match the seeded users in global-setup.ts
 */
export const TEST_CREDENTIALS = {
  email: 'james.smith@gmail.com',
  password: 'Admin123!',
} as const

/**
 * Sign in with the test admin user and navigate to the chat page
 * @param page - Playwright Page object
 * @param options - Configuration options
 * @param options.clearCookies - Whether to clear cookies before signing in
 * @param options.context - Playwright BrowserContext object for clearing cookies
 */
export async function signInAndNavigateToChat(
  page: Page,
  options?: { clearCookies?: boolean; context?: BrowserContext }
) {
  // Clear cookies if context provided
  if (options?.clearCookies && options?.context) {
    await options.context.clearCookies()
  }

  // Navigate to sign in page
  await page.goto('/signin')

  // Sign in as admin user
  const emailField = page.getByLabel(/email address/i)
  const passwordField = page.getByLabel(/^password/i)
  const submitButton = page.getByRole('button', { name: /^sign in$/i })

  await emailField.fill(TEST_CREDENTIALS.email)
  await passwordField.fill(TEST_CREDENTIALS.password)
  await submitButton.click()

  // Wait for redirect to dashboard
  await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

  // Click on chat navigation element
  const chatButton = page.getByTestId('chat')
  await expect(chatButton).toBeVisible()
  await chatButton.click()

  // Verify navigation to /ai page
  await expect(page).toHaveURL('/ai', { timeout: 10000 })
}

/**
 * Sign in with test credentials and wait for redirect to dashboard
 * @param page - Playwright Page object
 * @returns Promise that resolves when signin is complete
 */
export async function signInToDashboard(page: Page) {
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
}

/**
 * Invalidate the NextAuth session token cookie
 * @param context - Playwright BrowserContext object
 * @param invalidToken - Optional custom invalid token value (defaults to modified token)
 * @returns Promise that resolves when cookie is invalidated
 */
export async function invalidateSessionToken(context: BrowserContext, invalidToken?: string) {
  const cookies = await context.cookies()
  const sessionToken = cookies.find(
    (cookie) =>
      cookie.name === 'next-auth.session-token' ||
      cookie.name === '__Secure-next-auth.session-token'
  )

  expect(sessionToken).toBeDefined()

  if (sessionToken) {
    const tokenValue = invalidToken || sessionToken.value.slice(0, -5) + 'xxxxx'
    await context.addCookies([
      {
        ...sessionToken,
        value: tokenValue,
      },
    ])
  }
}
