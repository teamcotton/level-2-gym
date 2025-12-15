import { expect, test } from '@playwright/test'

test.describe('Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/registration')
  })

  test('should display the registration form with all elements', async ({ page }) => {
    // Check page title
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()

    // Check OAuth buttons
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible()

    // Check divider text
    await expect(page.getByText(/or sign up with email/i)).toBeVisible()

    // Check form fields
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByLabel(/^name/i)).toBeVisible()
    await expect(page.getByLabel(/^password/i, { exact: false })).toBeVisible()
    await expect(page.locator('input[autocomplete="new-password"]').nth(1)).toBeVisible() // Confirm password input

    // Check submit button
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()

    // Check sign in link
    await expect(page.getByText(/already have an account/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()

    // Check terms text
    await expect(
      page.getByText(
        /by creating an account, you agree to our terms of service and privacy policy/i
      )
    ).toBeVisible()
  })

  test('should allow filling in the registration form', async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i)
    const nameInput = page.getByLabel(/^name/i)
    const passwordInput = page.getByLabel(/^password/i, { exact: false }).first()
    const confirmPasswordInput = page.locator('input[autocomplete="new-password"]').nth(1)

    // Fill in form fields
    await emailInput.fill('test1@example.com')
    await nameInput.fill('John Doe')
    await passwordInput.fill('securepassword123')
    await confirmPasswordInput.fill('securepassword123')

    // Verify values were entered
    await expect(emailInput).toHaveValue('test1@example.com')
    await expect(nameInput).toHaveValue('John Doe')
    await expect(passwordInput).toHaveValue('securepassword123')
    await expect(confirmPasswordInput).toHaveValue('securepassword123')
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/^password/i, { exact: false }).first()
    const passwordToggle = page.getByLabel(/toggle password visibility/i).first()

    // Initially password should be hidden (type="password")
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Click toggle to show password
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // Click toggle to hide password again
    await passwordToggle.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should toggle confirm password visibility', async ({ page }) => {
    // Use autocomplete selector which remains stable when type attribute changes
    const confirmPasswordInput = page.locator('input[autocomplete="new-password"]').nth(1)
    const confirmPasswordToggle = page.getByLabel(/toggle confirm password visibility/i)

    // Initially confirm password should be hidden (type="password")
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password')

    // Click toggle to show confirm password
    await confirmPasswordToggle.click()
    await expect(confirmPasswordInput).toHaveAttribute('type', 'text')

    // Click toggle to hide confirm password again
    await confirmPasswordToggle.click()
    await expect(confirmPasswordInput).toHaveAttribute('type', 'password')
  })

  test('should submit the form when all fields are filled', async ({ page }) => {
    // Fill in all required fields
    await page.getByLabel(/email address/i).fill('test2@example.com')
    await page.getByLabel(/^name/i).fill('John Doe')
    await page
      .getByLabel(/^password/i, { exact: false })
      .first()
      .fill('securepassword123')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('securepassword123')

    // Click submit button
    const submitButton = page.getByRole('button', { name: /create account/i })
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // Verify form submission triggered (button was clickable and form exists)
    const form = page.locator('form')
    await expect(form).toBeVisible()
  })

  test('should navigate to sign in page when clicking sign in link', async ({ page }) => {
    const signInLink = page.getByRole('button', { name: /sign in/i })

    await signInLink.click()

    // Wait for navigation to signin page
    await page.waitForURL('/signin')
    await expect(page).toHaveURL('/signin')
  })

  test('should have proper form validation attributes', async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i)
    const nameInput = page.getByLabel(/^name/i)
    const passwordInput = page.getByLabel(/^password/i, { exact: false }).first()
    const confirmPasswordInput = page.locator('input[autocomplete="new-password"]').nth(1)

    // Check required attributes
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(nameInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
    await expect(confirmPasswordInput).toHaveAttribute('required', '')

    // Check email input type
    await expect(emailInput).toHaveAttribute('type', 'email')

    // Check autocomplete attributes
    await expect(emailInput).toHaveAttribute('autocomplete', 'email')
    await expect(nameInput).toHaveAttribute('autocomplete', 'name')
    await expect(passwordInput).toHaveAttribute('autocomplete', 'new-password')
    await expect(confirmPasswordInput).toHaveAttribute('autocomplete', 'new-password')
  })

  test('should display Google OAuth button with icon', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /google/i })

    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeEnabled()

    // Check that button has the Google icon (svg)
    const svg = googleButton.locator('svg')
    await expect(svg).toBeVisible()
  })

  test('should display GitHub OAuth button with icon', async ({ page }) => {
    const githubButton = page.getByRole('button', { name: /github/i })

    await expect(githubButton).toBeVisible()
    await expect(githubButton).toBeEnabled()

    // Check that button has the GitHub icon (svg)
    const svg = githubButton.locator('svg')
    await expect(svg).toBeVisible()
  })

  test('should have accessible form labels', async ({ page }) => {
    // Verify all inputs have associated labels
    const emailInput = page.getByLabel(/email address/i)
    const nameInput = page.getByLabel(/^name/i)
    const passwordInput = page.getByLabel(/^password/i, { exact: false }).first()
    const confirmPasswordInput = page.locator('input[autocomplete="new-password"]').nth(1)

    // All inputs should be accessible via their labels
    await expect(emailInput).toBeVisible()
    await expect(nameInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(confirmPasswordInput).toBeVisible()
  })

  test('should update field value when filling after clearing', async ({ page }) => {
    const emailInput = page.getByLabel(/email address/i)

    // Type something
    await emailInput.fill('initial@test.com')
    await expect(emailInput).toHaveValue('initial@test.com')

    // Clear and type something new
    await emailInput.clear()
    await emailInput.fill('new@test.com')
    await expect(emailInput).toHaveValue('new@test.com')
  })

  test('should have proper spacing and layout', async ({ page }) => {
    // Check that the main container is visible
    const heading = page.getByRole('heading', { name: /create your account/i })
    await expect(heading).toBeVisible()

    // Check that form is within a paper/card component (Material UI Paper)
    const form = page.locator('form')
    await expect(form).toBeVisible()
  })

  test('should show error when name is less than 2 characters', async ({ page }) => {
    const nameInput = page.getByLabel(/^name/i)
    const submitButton = page.getByRole('button', { name: /create account/i })

    // Fill in name with only 1 character
    await nameInput.fill('A')
    await nameInput.blur()

    // Fill other required fields to trigger validation on submit
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page
      .getByLabel(/^password/i, { exact: false })
      .first()
      .fill('securepassword123')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('securepassword123')

    // Submit form
    await submitButton.click()

    // Check for error message
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeVisible()
  })

  test('should show error when name exceeds 100 characters', async ({ page }) => {
    const nameInput = page.getByLabel(/^name/i)
    const submitButton = page.getByRole('button', { name: /create account/i })

    // Fill in name with 101 characters
    const longName = 'A'.repeat(101)
    await nameInput.fill(longName)
    await nameInput.blur()

    // Fill other required fields to trigger validation on submit
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page
      .getByLabel(/^password/i, { exact: false })
      .first()
      .fill('securepassword123')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('securepassword123')

    // Submit form
    await submitButton.click()

    // Check for error message
    await expect(page.getByText(/name must not exceed 100 characters/i)).toBeVisible()
  })

  test('should accept name with exactly 2 characters', async ({ page }) => {
    const nameInput = page.getByLabel(/^name/i)
    const submitButton = page.getByRole('button', { name: /create account/i })

    // Fill in name with exactly 2 characters
    await nameInput.fill('AB')

    // Fill other required fields
    await page.getByLabel(/email address/i).fill('test3@example.com')
    await page
      .getByLabel(/^password/i, { exact: false })
      .first()
      .fill('securepassword123')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('securepassword123')

    // Submit form
    await submitButton.click()

    // Should not show name error
    await expect(page.getByText(/name must be at least 2 characters/i)).toBeHidden()
  })

  test('should accept name with exactly 100 characters', async ({ page }) => {
    const nameInput = page.getByLabel(/^name/i)
    const submitButton = page.getByRole('button', { name: /create account/i })

    // Fill in name with exactly 100 characters
    const maxLengthName = 'A'.repeat(100)
    await nameInput.fill(maxLengthName)

    // Fill other required fields
    await page.getByLabel(/email address/i).fill('test4@example.com')
    await page
      .getByLabel(/^password/i, { exact: false })
      .first()
      .fill('securepassword123')
    await page.locator('input[autocomplete="new-password"]').nth(1).fill('securepassword123')

    // Submit form
    await submitButton.click()

    // Should not show name error
    await expect(page.getByText(/name must not exceed 100 characters/i)).toBeHidden()
  })
})
