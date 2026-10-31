import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

// 로컬 dev 서버가 아니라 실제 운영 도메인(Vercel↔EC2, cross-site)을 대상으로 함.
// webServer를 안 띄우는 이유: 테스트하려는 버그 자체가 "이 cross-site 배포 환경"에서만
// 재현되므로, 로컬 dev 서버로는 절대 재현이 안 됨 (frontend/docs/domain/user-restore-flow.md 참고).
export default defineConfig({
  testDir: ".",
  testMatch: /.*\.prod\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "https://moijang.vercel.app",
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
});
