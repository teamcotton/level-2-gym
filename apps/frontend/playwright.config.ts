import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: 'https://localhost:4321',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'https://localhost:4321',
    reuseExistingServer: !process.env.CI,
    ignoreHTTPSErrors: true,
    env: {
      BACKEND_AI_CALLBACK_URL_DEV: 'http://localhost:3000',
      BACKEND_AI_CALLBACK_URL_PROD: 'http://localhost:3000',
      // Ensure the un-suffixed env var is set for the Next dev server
      // so server-side calls (backendRequest) point to the local backend
      // during E2E tests.
      BACKEND_AI_CALLBACK_URL: 'http://localhost:3000',
    },
  },
})
