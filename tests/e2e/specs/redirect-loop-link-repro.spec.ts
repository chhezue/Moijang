import { test, expect } from "@playwright/test";

test("Link 클릭(소프트 네비)으로 protected 진입 시도 후 로그인 → redirect loop 재현 시도", async ({
  page,
  context,
}) => {
  await context.clearCookies();

  // 1. 공개 페이지를 하드 로드해서 hydrate 시킴 (guest 세션 시작)
  await page.goto("/group-buying/list/all");

  // 2. Next <Link> 클릭으로 protected 페이지 진입 "시도" - 소프트 네비게이션
  await page.getByTestId("temp-repro-link").click();

  // 3. (protected)/layout.tsx가 서버에서 redirect() -> /login?redirect=...
  await expect(page).toHaveURL(/\/login\?redirect=/, { timeout: 10000 });

  // 4. 로그인 (지금 loginForm.tsx는 임시로 순수 router.push()만 쓰는 원래 버그 버전)
  await page.getByLabel("아이디").fill(process.env.TEST_LEADER_ID!);
  await page.getByLabel("비밀번호").fill(process.env.TEST_LEADER_PW!);
  await page.getByRole("button", { name: "로그인" }).click();

  // loop면 /login에 그대로 남고, 성공하면 목적지로 이동함 - 둘 다 가능하니 URL을 강제하지 않고 대기만 함
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  const finalUrl = page.url();
  console.log("=== Link 기반 재현 시도 결과 ===");
  console.log("최종 URL:", finalUrl);
  console.log("redirect loop 재현 여부:", finalUrl.includes("/login"));
});
