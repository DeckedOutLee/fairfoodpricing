import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT ? Number(process.env.PORT) : 4321;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    colorScheme: 'light',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /no-js\.spec\.ts/,
    },
    {
      name: 'chromium-mobile',
      // iPhone 14 viewport but Chromium engine (Webkit not bundled here).
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
      testIgnore: /no-js\.spec\.ts/,
    },
    {
      name: 'chromium-no-js',
      use: { ...devices['Desktop Chrome'], javaScriptEnabled: false },
      testMatch: /no-js\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run preview -- --port ' + PORT,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
