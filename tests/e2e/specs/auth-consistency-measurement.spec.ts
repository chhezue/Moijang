/**
 * 정합성 이슈(로그인 후 redirect loop) 재현 + 전후 성능 측정용 스펙.
 * loginForm.tsx의 네비게이션 구현을 바꿔가며 이 파일을 반복 실행해서 비교한다.
 */
import { test, expect } from "@playwright/test";

const GB_ID = process.env.CONFIRMED_GB_ID!;
const PROTECTED_URL = `/dashboard/leading/${GB_ID}`;

test("로그인 후 원래 요청한 protected 페이지에 머무르는지 + 네비게이션 성능 측정", async ({
  page,
  context,
}) => {
  await context.clearCookies();

  await page.goto(PROTECTED_URL);
  await expect(page).toHaveURL(/\/login\?redirect=/);

  await page.getByLabel("아이디").fill(process.env.TEST_LEADER_ID!);
  await page.getByLabel("비밀번호").fill(process.env.TEST_LEADER_PW!);

  const clickTime = Date.now();
  await page.getByRole("button", { name: "로그인" }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
  const settleTime = Date.now();

  const finalUrl = page.url();
  const isLoop = finalUrl.includes("/login");

  const nav = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (!entry) return null;
    return {
      type: entry.type, // "navigate" | "reload" | "back_forward" | "prerender"
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
      loadEvent: entry.loadEventEnd - entry.startTime,
    };
  });

  console.log("=== 측정 결과 ===");
  console.log("최종 URL:", finalUrl);
  console.log("redirect loop 재현 여부:", isLoop);
  console.log("클릭→최종URL 도달까지(ms):", settleTime - clickTime);
  console.log("최종 페이지 Navigation Timing:", JSON.stringify(nav, null, 2));

  expect(isLoop, "redirect loop가 재현되면 안 됨").toBe(false);

  // AuthStoreProvider가 soft navigation 이후 fresh initialUser를 반영 못 하는 회귀 방지용 -
  // URL만 보고 "로그인 성공"이라 판단하면 헤더가 로그아웃 상태로 남는 버그를 놓친다.
  await expect(page.locator(".user-name")).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: "로그인" })).not.toBeVisible();
});
