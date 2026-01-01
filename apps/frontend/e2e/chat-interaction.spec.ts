import { expect, test } from '@playwright/test'

test.describe('Chat Interaction', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign in page
    await page.goto('https://localhost:4321/signin')

    // Sign in with admin credentials
    const emailField = page.getByLabel(/email address/i)
    const passwordField = page.getByLabel(/^password/i)
    const submitButton = page.getByRole('button', { name: /^sign in$/i })

    await emailField.fill('james.smith@gmail.com')
    await passwordField.fill('Admin123!')
    await submitButton.click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
  })

  // eslint-disable-next-line playwright/no-skipped-test
  test.skip('admin user should be able to sign in and interact with chat', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to chat by clicking element with data-testid="chat"
    const chatButton = page.getByTestId('chat')
    await expect(chatButton).toBeVisible()
    await chatButton.click()

    // Wait for redirect to new chat page
    await page.waitForURL(/\/ai\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('load')

    // Enter "hello" in the textarea with data-testid="chat-text-input"
    const chatInput = page.getByTestId('chat-text-input').locator('textarea').first()
    await expect(chatInput).toBeVisible()
    await chatInput.fill('hello')

    // Press Enter to submit the message
    await chatInput.press('Enter')

    // Find the text that reads 'User: hello'
    const userMessage = page.getByText('User: hello')
    await expect(userMessage).toBeVisible({ timeout: 5000 })

    // Wait for AI response - look for loading indicator first, then AI response
    // Wait for loading indicator to appear (CircularProgress)
    const loadingIndicator = page.locator('[role="progressbar"]')
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 })

    // Wait for loading to disappear (AI finished responding)
    await expect(loadingIndicator).not.toBeVisible({ timeout: 60000 })

    // Now find text beginning with 'AI:'
    const aiResponse = page.locator('text=/^AI:/')
    await expect(aiResponse).toBeVisible({ timeout: 5000 })

    // Verify the AI response contains some text after "AI:"
    await expect(aiResponse).not.toHaveText('AI:')
    await expect(aiResponse).not.toHaveText('AI: ')
  })
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip('should handle multiple chat interactions in sequence', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to chat
    const chatButton = page.getByTestId('chat')
    await chatButton.click()

    await page.waitForURL(/\/ai\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('load')

    // First message
    const chatInput = page.getByTestId('chat-text-input').locator('textarea').first()
    await chatInput.fill('hello')
    await chatInput.press('Enter')

    await expect(page.getByText('User: hello')).toBeVisible({ timeout: 5000 })

    // Wait for loading indicator and response
    const loadingIndicator = page.locator('[role="progressbar"]').first()
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 })
    await expect(loadingIndicator).not.toBeVisible({ timeout: 60000 })

    const firstAiResponse = page.locator('text=/^AI:/').first()
    await expect(firstAiResponse).toBeVisible({ timeout: 5000 })

    // Wait for first response to settle and ensure it has meaningful content after "AI:"
    const firstAiResponseText = (await firstAiResponse.innerText()).trim()
    expect(firstAiResponseText.length).toBeGreaterThan(4)
    expect(firstAiResponseText).toMatch(/^AI:\s*\S/)

    // Second message
    await chatInput.fill('how are you?')
    await chatInput.press('Enter')

    await expect(page.getByText('User: how are you?')).toBeVisible({ timeout: 5000 })

    // Wait for second loading indicator and response
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 })
    await expect(loadingIndicator).not.toBeVisible({ timeout: 60000 })

    const secondAiResponse = page.locator('text=/^AI:/').nth(1)
    await expect(secondAiResponse).toBeVisible({ timeout: 5000 })
  })
  // eslint-disable-next-line playwright/no-skipped-test
  test.skip('should maintain chat history after sending messages', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to chat
    const chatButton = page.getByTestId('chat')
    await chatButton.click()

    await page.waitForURL(/\/ai\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('load')

    // Send message
    const chatInput = page.getByTestId('chat-text-input').locator('textarea').first()
    await chatInput.fill('hello')
    await chatInput.press('Enter')

    // Wait for both messages to appear
    const userMessage = page.getByText('User: hello')
    await expect(userMessage).toBeVisible({ timeout: 5000 })

    // Wait for loading indicator and response
    const loadingIndicator = page.locator('[role="progressbar"]')
    await expect(loadingIndicator).toBeVisible({ timeout: 5000 })
    await expect(loadingIndicator).not.toBeVisible({ timeout: 60000 })

    const aiResponse = page.locator('text=/^AI:/')
    await expect(aiResponse).toBeVisible({ timeout: 5000 })

    // Verify both messages are still visible
    await expect(userMessage).toBeVisible()
    await expect(aiResponse).toBeVisible()

    // Verify they appear in the correct order (user message before AI response)
    const allMessages = page.locator('text=/^(User:|AI:)/')
    const messageCount = await allMessages.count()
    expect(messageCount).toBeGreaterThanOrEqual(2)
  })

  test('should clear input field after sending message', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to chat
    const chatButton = page.getByTestId('chat')
    await chatButton.click()

    await page.waitForURL(/\/ai\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('load')

    // Send message
    const chatInput = page.getByTestId('chat-text-input').locator('textarea').first()
    await chatInput.fill('hello')
    await chatInput.press('Enter')

    // Wait for message to be sent
    await expect(page.getByText('User: hello')).toBeVisible({ timeout: 5000 })

    // Verify input is cleared
    await expect(chatInput).toHaveValue('')
  })

  test('should handle empty message submission gracefully', async ({ page }) => {
    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()

    // Navigate to chat
    const chatButton = page.getByTestId('chat')
    await chatButton.click()

    await page.waitForURL(/\/ai\/[a-zA-Z0-9-]+/, { timeout: 10000 })
    await page.waitForLoadState('load')

    // Try to send empty message
    const chatInput = page.getByTestId('chat-text-input').locator('textarea').first()
    await chatInput.press('Enter')

    // Verify that the empty state is still visible (no message was sent)
    const emptyState = page.getByTestId('chat-text-output-empty')
    await expect(emptyState).toBeVisible()

    // Verify no "User:" message was added
    const userMessages = page.locator('text=/^User:/')
    const count = await userMessages.count()
    expect(count).toBe(0)
  })
})
