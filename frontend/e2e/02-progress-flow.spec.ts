import { test, expect, BrowserContext, Page } from "@playwright/test";
import { resetGbToConfirmed } from "./helpers/db";

const USERS = {
  leader: { loginId: "leader_test", password: "Test1234!" },
};

/**
 * CONFIRMED 상태인 공구 ID를 지정해주세요.
 * 실행 방법: CONFIRMED_GB_ID=<id> npx playwright test e2e/02-progress-flow.spec.ts
 */
const CONFIRMED_GB_ID = process.env.CONFIRMED_GB_ID ?? "6a2e8a661d75894aad6d0b3e";

async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("아이디").fill(loginId);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("/");
}

test.describe("Script 2: 공구 진행 플로우 (CONFIRMED → COMPLETED)", () => {
  let leaderCtx: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    if (!CONFIRMED_GB_ID) {
      throw new Error(
        "CONFIRMED_GB_ID 환경변수를 설정해주세요.\n" +
          "실행 예시: CONFIRMED_GB_ID=<gbId> npx playwright test e2e/02-progress-flow.spec.ts",
      );
    }
    leaderCtx = await browser.newContext();
    const page = await leaderCtx.newPage();
    await login(page, USERS.leader.loginId, USERS.leader.password);
    await page.close();
  });

  test.afterAll(async () => {
    await resetGbToConfirmed(CONFIRMED_GB_ID);
    await leaderCtx.close();
  });

  test("1. CONFIRMED 상태 총대 UI 확인", async () => {
    const page = await leaderCtx.newPage();
    await page.goto(`/group-buying/detail/${CONFIRMED_GB_ID}`);

    await expect(page.getByText("모집 완료").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "공구 상품 주문하기" })).toBeVisible();
    // 모집 중 버튼 없음
    await expect(page.getByRole("button", { name: "공동구매 수정" })).not.toBeVisible();

    await page.close();
  });

  test("2. CONFIRMED → ORDERED (공구 상품 주문하기)", async () => {
    const page = await leaderCtx.newPage();
    await page.goto(`/group-buying/detail/${CONFIRMED_GB_ID}`);

    await page.getByRole("button", { name: "공구 상품 주문하기" }).click();
    // 모달 확인
    await expect(page.getByText("공동구매 주문 진행")).toBeVisible();

    // 클릭 시 productUrl로 새 탭 열림 → 닫아줌
    page.once("popup", (popup) => popup.close());
    await page.getByRole("button", { name: "주문하러 가기" }).click();

    // ORDERED UI 확인
    await expect(page.getByRole("button", { name: "배송 완료 및 공지" })).toBeVisible();
    await expect(page.getByText("주문 진행 중").first()).toBeVisible();

    await page.close();
  });

  test("3. ORDERED → SHIPPED (배송 완료 및 공지)", async () => {
    const page = await leaderCtx.newPage();
    await page.goto(`/group-buying/detail/${CONFIRMED_GB_ID}`);

    await page.getByRole("button", { name: "배송 완료 및 공지" }).click();
    // 모달 확인
    await expect(page.getByText("수령 시간 및 장소 공지")).toBeVisible();

    await page.getByLabel("픽업 시간").fill("2026년 6월 20일 오후 6시");
    await page.getByLabel("픽업 장소").fill("정문 앞 공터");
    await page.getByRole("button", { name: "완료" }).click();

    // SHIPPED UI 확인
    await expect(page.getByText("배송 완료", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "수령 확인 및 공구 완료" })).toBeVisible();

    await page.close();
  });

  test("4. SHIPPED → COMPLETED (수령 확인 및 공구 완료)", async () => {
    const page = await leaderCtx.newPage();
    await page.goto(`/group-buying/detail/${CONFIRMED_GB_ID}`);

    await page.getByRole("button", { name: "수령 확인 및 공구 완료" }).click();
    // 모달 확인
    await expect(page.getByText("수령 확인 및 공동구매 완료")).toBeVisible();
    await page.getByRole("button", { name: "완료" }).click();

    // COMPLETED UI 확인
    await expect(page.getByText("공구 완료", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "수령 확인 및 공구 완료" })).not.toBeVisible();

    await page.close();
  });
});
