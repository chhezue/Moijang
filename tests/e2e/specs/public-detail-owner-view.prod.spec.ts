/**
 * getGroupBuyingByIdServer() 공개/개인화 분리 회귀 테스트 (운영 도메인 대상, TDD).
 *
 * 이 함수가 아직 withServerCookies()로 쿠키를 forward하는데, cross-site라
 * 쿠키가 전달이 안 돼서 리더 본인이 자기 공구의 "공개" 상세페이지를 봐도
 * 항상 게스트로 취급됨 — Sidebar.tsx가 "로그인 후 참여해 보세요" 문구를 보여줌.
 *
 * GH #39(공개/개인화 분리) 이전엔 이 테스트가 fail해야 정상임.
 * #39 이후 pass로 바뀌는 게 완료 기준.
 *
 * 실행: cd tests && npx playwright test --config=playwright.prod.config.ts
 */
import { test, expect } from "@playwright/test";

const LEADER = {
  loginId: process.env.TEST_LEADER_ID!,
  password: process.env.TEST_LEADER_PW!,
};
const GB_ID = process.env.CONFIRMED_GB_ID ?? "6a2e8a661d75894aad6d0b3e";

test.describe("공개 상세페이지에서 리더 본인의 뷰가 정확히 반영되는지", () => {
  test.beforeEach(() => {
    test.skip(!LEADER.loginId || !LEADER.password, "tests/.env에 TEST_LEADER_ID/PW가 없음");
  });

  test("리더 본인이 자기 공구의 공개 상세페이지에서 '대시보드에서 관리하기'를 본다 (게스트 문구가 아니라)", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("아이디").fill(LEADER.loginId);
    await page.getByLabel("비밀번호").fill(LEADER.password);
    await page.getByRole("button", { name: "로그인" }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

    await page.goto(`/group-buying/detail/${GB_ID}`);
    await page.waitForTimeout(1500);

    await expect(page.getByText("대시보드에서 관리하기")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("로그인 후 공구에 참여해 보세요!")).not.toBeVisible();
  });
});
