import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../frontend/.env") });

export default defineConfig({
  testDir: ".",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  maxFailures: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    trace: "on",
    video: "on",
    screenshot: "on",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: "npm run dev",
    cwd: path.resolve(__dirname, "../frontend"),
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
