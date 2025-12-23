import { expect, test } from '@playwright/test'

test.describe('Protected Routes Authentication', () => {
  test.beforeEach(async ({ context }) => {
    // Clear all cookies to ensure user is not signed in
    await context.clearCookies()
  })

  test('should redirect unauthenticated user from /admin to signin page', async ({ page }) => {
    // Navigate to admin page (a protected route)
    await page.goto('/admin')

    // Wait for navigation to complete
    await page.waitForURL(/\/signin/)

    // Verify user is redirected to signin page
    expect(page.url()).toContain('/signin')

    // Verify the callbackUrl parameter is set to redirect back to admin after login
    const url = new URL(page.url())
    expect(url.searchParams.get('callbackUrl')).toBe('/admin')

    // Verify signin page elements are visible
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible()
  })

  test('should redirect unauthenticated user from /dashboard to signin page', async ({ page }) => {
    // Navigate to dashboard page (a protected route)
    await page.goto('/dashboard')

    // Wait for navigation to complete
    await page.waitForURL(/\/signin/)

    // Verify user is redirected to signin page
    expect(page.url()).toContain('/signin')

    // Verify the callbackUrl parameter preserves the original destination
    const url = new URL(page.url())
    expect(url.searchParams.get('callbackUrl')).toBe('/dashboard')
  })

  test('should redirect unauthenticated user from /profile to signin page', async ({ page }) => {
    // Navigate to profile page (a protected route)
    await page.goto('/profile')

    // Wait for navigation to complete
    await page.waitForURL(/\/signin/)

    // Verify user is redirected to signin page
    expect(page.url()).toContain('/signin')

    // Verify the callbackUrl parameter preserves the original destination
    const url = new URL(page.url())
    expect(url.searchParams.get('callbackUrl')).toBe('/profile')
  })

  test('should redirect unauthenticated user from nested admin route to signin page', async ({
    page,
  }) => {
    // Navigate to a nested admin route
    await page.goto('/admin/users')

    // Wait for navigation to complete
    await page.waitForURL(/\/signin/)

    // Verify user is redirected to signin page
    expect(page.url()).toContain('/signin')

    // Verify the callbackUrl parameter preserves the full path
    const url = new URL(page.url())
    expect(url.searchParams.get('callbackUrl')).toBe('/admin/users')
  })

  test('should allow unauthenticated user to access public routes', async ({ page }) => {
    // Navigate to homepage (public route)
    await page.goto('/')

    // Verify user remains on homepage
    expect(page.url()).not.toContain('/signin')
    await expect(page.locator('h1')).toContainText('Level 2 Gym')
  })

  test('should allow unauthenticated user to access registration page', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/registration')

    // Verify user remains on registration page
    expect(page.url()).toContain('/registration')
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
  })
})
