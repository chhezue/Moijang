/**
 * cross-site 쿠키 복원 회귀 테스트 (운영 도메인 대상, TDD).
 *
 * 로컬 dev 서버로는 재현이 안 되는 버그라서 운영 도메인(moijang.vercel.app)을
 * 대상으로 함 — frontend/docs/domain/user-restore-flow.md "알려진 문제" 참고.
 *
 * GH #37(인증 transport 전환) 이전엔 이 테스트가 fail해야 정상임.
 * #37 이후 이 테스트가 pass로 바뀌는 게 완료 기준(GH #43).
 *
 * 실행: cd tests && npx playwright test --config=playwright.prod.config.ts
 */
import { test, expect } from "@playwright/test";

const LEADER = {
  loginId: process.env.TEST_LEADER_ID!,
  password: process.env.TEST_LEADER_PW!,
};

test.describe("cross-site 환경에서 로그인 후 인증 상태 복원", () => {
  test.beforeEach(() => {
    test.skip(!LEADER.loginId || !LEADER.password, "tests/.env에 TEST_LEADER_ID/PW가 없음");
  });

  test("로그인 후 Header에 유저 이름이 반영된다", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("아이디").fill(LEADER.loginId);
    await page.getByLabel("비밀번호").fill(LEADER.password);
    await page.getByRole("button", { name: "로그인" }).click();

    // window.location.href 리로드 포함, 최종적으로 /login을 벗어날 때까지 대기
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

    // 로그인 성공했으면 Header가 "로그인" 버튼 대신 유저 이름(.user-name)을 보여줘야 함
    await expect(page.getByRole("button", { name: "로그인" })).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator(".user-name")).toBeVisible({ timeout: 5000 });
  });

  test("로그인 후 보호 라우트(/dashboard/leading)에 진입할 수 있다", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("아이디").fill(LEADER.loginId);
    await page.getByLabel("비밀번호").fill(LEADER.password);
    await page.getByRole("button", { name: "로그인" }).click();
    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });

    await page.goto("/dashboard/leading");

    // (protected)/layout.tsx가 미인증으로 오판하면 /login?redirect=...로 튕겨나감
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
  });
});
