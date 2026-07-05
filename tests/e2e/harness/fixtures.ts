import { Browser, BrowserContext, Page } from "@playwright/test";

export interface UserCredentials {
  loginId: string;
  password: string;
}

export async function login(page: Page, loginId: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("아이디").fill(loginId);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}

export async function createAuthContext(
  browser: Browser,
  credentials: UserCredentials,
): Promise<BrowserContext> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, credentials.loginId, credentials.password);
  await page.close();
  return ctx;
}
