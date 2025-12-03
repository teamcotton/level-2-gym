import { test, expect } from '@playwright/test';

test('homepage has title and heading', async ({ page }) => {
  await page.goto('/');

  // Expect the page to have the correct title
  await expect(page).toHaveTitle(/Level 2 Gym/);

  // Expect to see the main heading
  await expect(page.locator('h1')).toContainText('Level 2 Gym');
});
