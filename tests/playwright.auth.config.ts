import { defineConfig } from '@playwright/test';
import config from './playwright.config';

export default defineConfig({
  ...config,
  testMatch: 'e2e/specs/login-redirect.browser.spec.ts',
  use: {
    baseURL: 'http://localhost:3147',
    headless: true,
    video: 'off',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    ...config.webServer,
    command: 'npm run dev -- --port 3147',
    url: 'http://localhost:3147',
    reuseExistingServer: !process.env.CI,
  },
});
