import { expect, test } from '@playwright/test'

test.describe('Sign In Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
  })

  test('should display the sign in form with all required elements', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()

    // Check email field
    await expect(page.getByLabel(/email address/i)).toBeVisible()

    // Check password field
    await expect(page.getByLabel(/^password/i)).toBeVisible()

    // Check submit button
    await expect(page.getByRole('button', { name: /^sign in$/i })).toBeVisible()

    // Check forgotten password link
    await expect(page.getByRole('button', { name: /forgot password/i })).toBeVisible()

    // Check sign up message and link
    await expect(page.getByText(/don't have an account/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
  })
})
