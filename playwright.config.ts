import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  workers: 2,
  expect: {
    timeout: 8000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'Mobile Landscape',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 915, height: 412 },
      },
    },
  ],
});
