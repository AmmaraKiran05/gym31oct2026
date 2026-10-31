import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_WEB_PORT) || 4174

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-results/e2e-report' }]],
  outputDir: 'test-results/e2e-artifacts',
  globalTeardown: './e2e/global-teardown.js',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    // iPhone-size screen (375px wide) rendered with Chromium
    { name: 'mobile-iphone', use: { ...devices['iPhone 11 Pro'], browserName: 'chromium', defaultBrowserType: 'chromium' } },
  ],
  // Production build + real /api handlers on the separate pulsefit_test database.
  webServer: {
    command: 'node scripts/test-stack.js',
    url: `http://127.0.0.1:${PORT}/api/stats`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
  },
})
