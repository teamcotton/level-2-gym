import { expect, test } from '@playwright/test'

import { TEST_CREDENTIALS } from './helpers.js'

test.describe('Dashboard Sign Out', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/signin')

    // Sign in with test user credentials
    const emailField = page.getByLabel(/email address/i)
    const passwordField = page.getByLabel(/^password/i)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })

    await emailField.fill(TEST_CREDENTIALS.email)
    await passwordField.fill(TEST_CREDENTIALS.password)
    await submitButton.click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  test('should successfully sign out user when clicking Sign Out button', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Verify Sign Out button is visible
    const signOutButton = page.getByRole('button', { name: /sign out/i })
    await expect(signOutButton).toBeVisible()

    // Click the Sign Out button
    await signOutButton.click()

    // Wait for navigation to NextAuth signout page
    await page.waitForURL(/\/api\/auth\/signout/, { timeout: 5000 })

    // NextAuth shows a confirmation page - click the sign out button on that page
    const confirmSignOutButton = page.getByRole('button', { name: /sign out/i })
    await expect(confirmSignOutButton).toBeVisible({ timeout: 2000 })
    await confirmSignOutButton.click()

    // Wait for redirect after sign out (usually to homepage or signin)
    await page.waitForLoadState('load', { timeout: 5000 })

    // Verify user is signed out by trying to access dashboard
    await page.goto('/dashboard')

    // Should be redirected to signin page
    await page.waitForURL(/\/signin/, { timeout: 5000 })
    expect(page.url()).toContain('/signin')

    // Verify signin page is displayed
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('should not maintain session after sign out and page refresh', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Click Sign Out button
    const signOutButton = page.getByRole('button', { name: /sign out/i })
    await signOutButton.click()

    // Wait for navigation to NextAuth signout page
    await page.waitForURL(/\/api\/auth\/signout/, { timeout: 5000 })

    // Confirm sign out on confirmation page
    const confirmSignOutButton = page.getByRole('button', { name: /sign out/i })
    await expect(confirmSignOutButton).toBeVisible({ timeout: 2000 })
    await confirmSignOutButton.click()

    // Wait for redirect
    await page.waitForLoadState('load', { timeout: 5000 })

    // Try to access dashboard again
    await page.goto('/dashboard')

    // Should be redirected to signin
    await page.waitForURL(/\/signin/, { timeout: 5000 })

    // Refresh the page
    await page.reload()

    // Should still be on signin page (no session maintained)
    expect(page.url()).toContain('/signin')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('should not allow access to protected routes after sign out', async ({ page }) => {
    // Sign out
    const signOutButton = page.getByRole('button', { name: /sign out/i })
    await signOutButton.click()

    // Wait for signout flow
    await page.waitForURL(/\/api\/auth\/signout/, { timeout: 5000 })
    const confirmSignOutButton = page.getByRole('button', { name: /sign out/i })
    await expect(confirmSignOutButton).toBeVisible({ timeout: 2000 })
    await confirmSignOutButton.click()
    await page.waitForLoadState('load', { timeout: 5000 })

    // Try to access various protected routes
    const protectedRoutes = ['/dashboard', '/profile', '/admin']

    for (const route of protectedRoutes) {
      await page.goto(route)

      // Should be redirected to signin
      await page.waitForURL(/\/signin/, { timeout: 5000 })
      expect(page.url()).toContain('/signin')

      // Verify callbackUrl is set to redirect back after login
      const url = new URL(page.url())
      expect(url.searchParams.get('callbackUrl')).toBe(route)
    }
  })
})
