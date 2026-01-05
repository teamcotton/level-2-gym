import { expect, test } from '@playwright/test'

test.describe('Chat Interaction', () => {
  test('should navigate to chat page and verify form is disabled for new chat', async ({
    context,
    page,
  }) => {
    // Clear cookies and storage for clean state
    await context.clearCookies()

    // Navigate to sign in page
    await page.goto('/signin')

    // Sign in as admin user
    const emailField = page.getByLabel(/email address/i)
    const passwordField = page.getByLabel(/^password/i)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })

    await emailField.fill('james.smith@gmail.com')
    await passwordField.fill('Admin123!')
    await submitButton.click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Click on chat navigation element
    const chatButton = page.getByTestId('chat')
    await expect(chatButton).toBeVisible()
    await chatButton.click()

    // Verify navigation to /ai page
    await expect(page).toHaveURL('/ai', { timeout: 10000 })

    // Verify form elements are disabled - use simple selectors
    const textInput = page.getByPlaceholder('Type your message...')
    await expect(textInput).toBeVisible()
    await expect(textInput).toBeDisabled()

    // Verify submit button is disabled (IconButton with type="submit")
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeDisabled()

    // Verify file upload button is disabled
    const fileUploadButton = page.getByTestId('file-upload-button')
    await expect(fileUploadButton).toBeDisabled()
  })

  test('should display error message in UI when API request fails', async ({ context, page }) => {
    // Clear cookies and storage for clean state
    await context.clearCookies()

    // Navigate to sign in page
    await page.goto('/signin')

    // Sign in as admin user
    const emailField = page.getByLabel(/email address/i)
    const passwordField = page.getByLabel(/^password/i)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })

    await emailField.fill('james.smith@gmail.com')
    await passwordField.fill('Admin123!')
    await submitButton.click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })

    // Navigate to chat page
    const chatButton = page.getByTestId('chat')
    await expect(chatButton).toBeVisible()
    await chatButton.click()
    await expect(page).toHaveURL('/ai', { timeout: 10000 })

    // Click "New Chat" button to enable the form
    const newChatButton = page.getByRole('button', { name: /new chat/i })
    await expect(newChatButton).toBeVisible()
    await newChatButton.click()

    // Wait for URL to change to a new chat ID
    await page.waitForURL(/\/ai\/[a-f0-9-]+/, { timeout: 5000 })

    // Intercept API request and return an error response
    await page.route('**/api/ai/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred while processing your request',
        }),
      })
    })

    // Type a message and submit
    const textInput = page.getByPlaceholder('Type your message...')
    await expect(textInput).toBeVisible()
    await expect(textInput).toBeEnabled()
    await textInput.fill('Test message that will trigger an error')

    const submitBtn = page.locator('button[type="submit"]')
    await submitBtn.click()

    // Wait for and verify the error Alert is displayed
    const errorAlert = page.getByTestId('error-alert')
    await expect(errorAlert).toBeVisible({ timeout: 5000 })

    // Verify the error message contains expected text
    await expect(errorAlert).toContainText(/error|failed/i)

    // Verify the alert has error severity (red color scheme)
    await expect(errorAlert).toHaveClass(/MuiAlert-standardError/)

    // Verify the close button is present
    const closeButton = errorAlert.getByRole('button', { name: /close/i })
    await expect(closeButton).toBeVisible()

    // Click close button and verify alert is removed from DOM
    await closeButton.click()
    await expect(errorAlert).not.toBeAttached()
  })
})
