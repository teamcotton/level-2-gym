import { expect, test } from '@playwright/test'

test.describe('Error Page', () => {
  test('should display default error page with 500 code', async ({ page }) => {
    await page.goto('/error')

    // Verify the error code heading is visible
    await expect(page.getByRole('heading', { level: 1, name: '500' })).toBeVisible()

    // Verify the main error message heading
    await expect(
      page.getByRole('heading', { level: 2, name: /oops! something went wrong/i })
    ).toBeVisible()

    // Verify the default error message
    await expect(page.getByText(/an unexpected error occurred/i)).toBeVisible()

    // Verify the support message
    await expect(page.getByText(/if this problem persists, please contact support/i)).toBeVisible()
  })

  test('should display navigation buttons', async ({ page }) => {
    await page.goto('/error')

    // Verify Go Back button is visible
    await expect(page.getByRole('button', { name: /go back/i })).toBeVisible()

    // Verify Go Home button is visible
    await expect(page.getByRole('button', { name: /go home/i })).toBeVisible()
  })

  test('should display custom error code from query parameter', async ({ page }) => {
    await page.goto('/error?code=404')

    // Verify the custom error code is displayed
    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()

    // Default message should still be shown
    await expect(page.getByText(/an unexpected error occurred/i)).toBeVisible()
  })

  test('should display custom error message from query parameter', async ({ page }) => {
    await page.goto('/error?message=Page+not+found')

    // Default error code should be shown
    await expect(page.getByRole('heading', { level: 1, name: '500' })).toBeVisible()

    // Custom message should be displayed
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })

  test('should display both custom error code and message from query parameters', async ({
    page,
  }) => {
    await page.goto('/error?code=403&message=Access+forbidden')

    // Verify custom error code
    await expect(page.getByRole('heading', { level: 1, name: '403' })).toBeVisible()

    // Verify custom error message
    await expect(page.getByText(/access forbidden/i)).toBeVisible()
  })

  test('should navigate home when Go Home button is clicked', async ({ page }) => {
    await page.goto('/error')

    // Click the Go Home button
    await page.getByRole('button', { name: /go home/i }).click()

    // Wait for navigation to complete
    await page.waitForURL(/\/signin/)

    // Verify we're redirected to signin (since homepage redirects to signin)
    await expect(page).toHaveURL(/.*\/signin/)
  })

  test('should navigate back when Go Back button is clicked', async ({ page }) => {
    // First navigate to signin page
    await page.goto('/signin')

    // Then navigate to error page
    await page.goto('/error')

    // Click the Go Back button
    await page.getByRole('button', { name: /go back/i }).click()

    // Wait for navigation
    await page.waitForLoadState('load')

    // Verify we're back on signin page
    await expect(page).toHaveURL(/.*\/signin/)
  })

  test('should have proper heading hierarchy for accessibility', async ({ page }) => {
    await page.goto('/error')

    // Verify h1 exists (error code)
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()

    // Verify h2 exists (error message heading)
    const h2 = page.getByRole('heading', { level: 2 })
    await expect(h2).toBeVisible()
  })

  test('should display error icon', async ({ page }) => {
    await page.goto('/error')

    // Check for SVG icon with error outline
    const errorIcon = page.locator('svg[data-testid="ErrorOutlineIcon"]')
    await expect(errorIcon).toBeVisible()
  })

  test('should have accessible button labels', async ({ page }) => {
    await page.goto('/error')

    // Both buttons should be visible and have text
    const goBackButton = page.getByRole('button', { name: /go back/i })
    const goHomeButton = page.getByRole('button', { name: /go home/i })

    await expect(goBackButton).toBeVisible()
    await expect(goHomeButton).toBeVisible()
    await expect(goBackButton).toHaveText(/go back/i)
    await expect(goHomeButton).toHaveText(/go home/i)
  })

  test('should handle URL encoded error messages', async ({ page }) => {
    const errorMessage = 'The requested resource could not be found on this server'
    const encodedMessage = encodeURIComponent(errorMessage)

    await page.goto(`/error?code=404&message=${encodedMessage}`)

    // Verify decoded message is displayed
    await expect(page.getByText(new RegExp(errorMessage, 'i'))).toBeVisible()
  })

  test('should handle long error messages', async ({ page }) => {
    const longMessage =
      'This is a very long error message that describes a complex error situation with multiple details and explanations about what went wrong in the application'
    const encodedMessage = encodeURIComponent(longMessage)

    await page.goto(`/error?message=${encodedMessage}`)

    // Verify the long message is displayed
    const messageStart = longMessage.substring(0, 50)
    await expect(page.getByText(messageStart)).toBeVisible()
  })

  test('should display page title', async ({ page }) => {
    await page.goto('/error')

    // Verify the page has a title
    await expect(page).toHaveTitle(/Norbert's Spark/)
  })

  test('should handle 404 error scenario', async ({ page }) => {
    await page.goto('/error?code=404&message=Page+Not+Found')

    await expect(page.getByRole('heading', { level: 1, name: '404' })).toBeVisible()
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })

  test('should handle 403 error scenario', async ({ page }) => {
    await page.goto('/error?code=403&message=Forbidden')

    await expect(page.getByRole('heading', { level: 1, name: '403' })).toBeVisible()
    await expect(page.getByText(/forbidden/i)).toBeVisible()
  })

  test('should handle 503 error scenario', async ({ page }) => {
    await page.goto('/error?code=503&message=Service+Unavailable')

    await expect(page.getByRole('heading', { level: 1, name: '503' })).toBeVisible()
    await expect(page.getByText(/service unavailable/i)).toBeVisible()
  })

  test('should have proper responsive layout', async ({ page }) => {
    await page.goto('/error')

    // Get the container element
    const container = page.locator('.MuiContainer-root')
    await expect(container).toBeVisible()

    // Verify buttons are in a flex container
    const buttonContainer = page
      .locator('div')
      .filter({ has: page.getByRole('button') })
      .first()
    await expect(buttonContainer).toBeVisible()
  })

  test('should display buttons with correct visual hierarchy', async ({ page }) => {
    await page.goto('/error')

    // Go Back should be outlined button
    const goBackButton = page.getByRole('button', { name: /go back/i })
    await expect(goBackButton).toHaveClass(/MuiButton-outlined/)

    // Go Home should be contained button (primary)
    const goHomeButton = page.getByRole('button', { name: /go home/i })
    await expect(goHomeButton).toHaveClass(/MuiButton-contained/)
  })

  test('should handle missing query parameters gracefully', async ({ page }) => {
    // Navigate with no query params
    await page.goto('/error?')

    // Should display defaults
    await expect(page.getByRole('heading', { level: 1, name: '500' })).toBeVisible()
    await expect(page.getByText(/an unexpected error occurred/i)).toBeVisible()
  })

  test('should handle only error code parameter', async ({ page }) => {
    await page.goto('/error?code=401')

    await expect(page.getByRole('heading', { level: 1, name: '401' })).toBeVisible()
    await expect(page.getByText(/an unexpected error occurred/i)).toBeVisible()
  })

  test('should handle only error message parameter', async ({ page }) => {
    await page.goto('/error?message=Unauthorized+access')

    await expect(page.getByRole('heading', { level: 1, name: '500' })).toBeVisible()
    await expect(page.getByText(/unauthorized access/i)).toBeVisible()
  })
})
