import { test, expect, BrowserContext, Page } from "@playwright/test";
import {
  getUserIdByLoginId,
  seedParticipant,
  removeParticipant,
  setGbStatus,
  resetGbToConfirmed,
} from "./helpers/db";

const USERS = {
  participant: { loginId: "participant1", password: "Test1234!" },
};

const GB_ID = process.env.CONFIRMED_GB_ID ?? "6a2e8a661d75894aad6d0b3e";

async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("아이디").fill(loginId);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("/");
}

test.describe("Script 3: 참여자 상태별 UI 확인", () => {
  let participantCtx: BrowserContext;
  let participantUserId: string;

  test.beforeAll(async ({ browser }) => {
    // 참여자 userId 조회 후 시딩
    participantUserId = await getUserIdByLoginId(USERS.participant.loginId);
    await seedParticipant(GB_ID, participantUserId, 1);

    participantCtx = await browser.newContext();
    const page = await participantCtx.newPage();
    await login(page, USERS.participant.loginId, USERS.participant.password);
    await page.close();
  });

  test.afterAll(async () => {
    await removeParticipant(GB_ID, participantUserId);
    await resetGbToConfirmed(GB_ID);
    await participantCtx.close();
  });

  test("1. RECRUITING - 참여 취소 버튼 보임", async () => {
    await setGbStatus(GB_ID, "RECRUITING");

    const page = await participantCtx.newPage();
    await page.goto(`/group-buying/detail/${GB_ID}`);

    await expect(page.getByRole("button", { name: "참여 취소" })).toBeVisible();
    await expect(page.getByRole("button", { name: "공동구매 참여하기" })).not.toBeVisible();
    await expect(page.getByText("모집 중").first()).toBeVisible();

    await page.close();
  });

  test("2. CONFIRMED - 액션 버튼 없음", async () => {
    await setGbStatus(GB_ID, "CONFIRMED");

    const page = await participantCtx.newPage();
    await page.goto(`/group-buying/detail/${GB_ID}`);

    await expect(page.getByRole("button", { name: "참여 취소" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "공동구매 참여하기" })).not.toBeVisible();
    await expect(page.getByText("모집 완료").first()).toBeVisible();

    await page.close();
  });

  test("3. ORDERED - 액션 버튼 없음", async () => {
    await setGbStatus(GB_ID, "ORDERED");

    const page = await participantCtx.newPage();
    await page.goto(`/group-buying/detail/${GB_ID}`);

    await expect(page.getByRole("button", { name: "참여 취소" })).not.toBeVisible();
    await expect(page.getByText("주문 진행 중").first()).toBeVisible();

    await page.close();
  });

  test("4. SHIPPED - 픽업 정보 표시", async () => {
    await setGbStatus(GB_ID, "SHIPPED", {
      pickupTime: "2026년 6월 20일 오후 6시",
      pickupPlace: "정문 앞 공터",
    });

    const page = await participantCtx.newPage();
    await page.goto(`/group-buying/detail/${GB_ID}`);

    await expect(page.getByText("배송 완료", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("정문 앞 공터")).toBeVisible();
    await expect(page.getByText("2026년 6월 20일 오후 6시")).toBeVisible();
    await expect(page.getByRole("button", { name: "참여 취소" })).not.toBeVisible();

    await page.close();
  });

  test("5. COMPLETED - 완료 표시", async () => {
    await setGbStatus(GB_ID, "COMPLETED");

    const page = await participantCtx.newPage();
    await page.goto(`/group-buying/detail/${GB_ID}`);

    await expect(page.getByText("공구 완료", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "참여 취소" })).not.toBeVisible();

    await page.close();
  });
});
