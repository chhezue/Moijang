import { test, expect } from "@playwright/test";

const GB_ID = process.env.CONFIRMED_GB_ID!;
const PROTECTED_URL = `/dashboard/leading/${GB_ID}`;

test("protected 페이지에서 로그아웃하면 홈으로 이동해야 함 (로그인 화면으로 안 튕겨야 함)", async ({
  page,
  context,
}) => {
  await context.clearCookies();

  await page.goto(PROTECTED_URL);
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await page.getByLabel("아이디").fill(process.env.TEST_LEADER_ID!);
  await page.getByLabel("비밀번호").fill(process.env.TEST_LEADER_PW!);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL(PROTECTED_URL, { timeout: 15000 });

  await page.locator(".user-name").click();
  await page.getByText("로그아웃").click();

  await page.waitForURL((url) => url.pathname === "/" || url.pathname.includes("/group-buying"), {
    timeout: 15000,
  });
  const finalUrl = page.url();

  expect(finalUrl.includes("/login"), "로그아웃 후 /login으로 튕기면 안 됨").toBe(false);
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible({ timeout: 5000 });
});
