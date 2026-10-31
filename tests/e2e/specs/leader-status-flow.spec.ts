/**
 * AI가 생성한 정적 Playwright 스크립트입니다.
 * 이 파일은 full-flow.ai.spec.ts를 RUN_AI_AGENT=true로 실행하면 자동 갱신됩니다.
 * CI에서는 이 파일만 실행합니다 (AI 없음).
 * 마지막 생성: 2026-07-03T07:44:49.888Z
 */
import { test, expect, BrowserContext } from "@playwright/test";
import { createAuthContext } from "../harness/fixtures";
import {
  clearParticipants,
  restoreParticipants,
  resetGbToConfirmed,
  deleteInitiatedPayments,
  type ParticipantSnapshot,
} from "../harness/cleanup";
import { setGbStatus, getUserIdByLoginId, seedParticipant } from "../harness/seed";

const USERS = {
  leader: { loginId: process.env.TEST_LEADER_ID!, password: process.env.TEST_LEADER_PW! },
  participant1: { loginId: process.env.TEST_PARTICIPANT1_ID!, password: process.env.TEST_PARTICIPANT1_PW! },
};

const GB_ID = process.env.CONFIRMED_GB_ID ?? "6a2e8a661d75894aad6d0b3e";
const DASHBOARD_URL = `/dashboard/leading/${GB_ID}`;

test.describe("공구 전체 플로우 (UI)", () => {
  test.setTimeout(90_000);

  let leaderCtx: BrowserContext;
  let participantCtx: BrowserContext;
  let participantSnapshot: ParticipantSnapshot[] = [];

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    participantSnapshot = await clearParticipants(GB_ID);
    await deleteInitiatedPayments(GB_ID);
    await setGbStatus(GB_ID, "RECRUITING", { endDate: new Date("2027-12-31") });

    const participant1UserId = await getUserIdByLoginId(USERS.participant1.loginId);
    const participant2UserId = await getUserIdByLoginId(process.env.TEST_PARTICIPANT2_ID!);
    await seedParticipant(GB_ID, participant1UserId, 1);
    await seedParticipant(GB_ID, participant2UserId, 2);

    leaderCtx = await createAuthContext(browser, USERS.leader);
    participantCtx = await createAuthContext(browser, USERS.participant1);
  });

  test.afterAll(async () => {
    await restoreParticipants(GB_ID, participantSnapshot);
    await resetGbToConfirmed(GB_ID);
    await leaderCtx?.close();
    await participantCtx?.close();
  });

  test("1. 참여자 뷰 - CONFIRMED 상태에서 진행사항 확인 버튼", async () => {
    await setGbStatus(GB_ID, "CONFIRMED");
    const page = await participantCtx.newPage();
    await page.goto(`/group-buying/detail/${GB_ID}`);

    await expect(page.locator("role=button[name='진행사항 확인하기']").first()).toBeVisible({ timeout: 10000 });
    await page.close();
  });

  test("2. 총대 CONFIRMED → ORDERED", async () => {
    await setGbStatus(GB_ID, "CONFIRMED");
    const page = await leaderCtx.newPage();
    await page.goto(DASHBOARD_URL);
  await page.locator("[data-testid='btn-order']").click();
  await page.locator('[role="dialog"]').locator("[data-testid='btn-modal-confirm']").click();
    await expect(page.locator("[data-testid='btn-shipped']").first()).toBeVisible({ timeout: 10000 });
    await page.close();
  });

  test("3. 총대 ORDERED → SHIPPED", async () => {
    await setGbStatus(GB_ID, "ORDERED");
    const page = await leaderCtx.newPage();
    await page.goto(DASHBOARD_URL);
  await page.locator("[data-testid='btn-shipped']").click();
  await page.locator("[data-testid='input-pickup-time']").fill("2026-12-01 18:00");
  await page.locator("[data-testid='input-pickup-place']").fill("정문 앞");
  await page.locator('[role="dialog"]').locator("[data-testid='btn-shipped-submit']").click();
    await expect(page.locator("[data-testid='btn-complete']").first()).toBeVisible({ timeout: 10000 });
    await page.close();
  });

  test("4. 총대 SHIPPED → COMPLETED", async () => {
    await setGbStatus(GB_ID, "SHIPPED");
    const page = await leaderCtx.newPage();
    await page.goto(DASHBOARD_URL);
  await page.locator("[data-testid='btn-complete']").click();
  await page.locator('[role="dialog"]').locator("[data-testid='btn-modal-confirm']").click();
    await expect(page.locator("text=성공적으로 끝났어요").first()).toBeVisible({ timeout: 10000 });
    await page.close();
  });
});
