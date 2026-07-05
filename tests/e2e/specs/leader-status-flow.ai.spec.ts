/**
 * AI 코드 생성기. RUN_AI_AGENT=true 일 때만 실행.
 * UI를 보면서 selector를 발견하고 full-flow.spec.ts를 생성합니다.
 * CI에서는 full-flow.spec.ts만 실행합니다 (AI 없음).
 */
import { test, BrowserContext } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { runAgentLoop, recordedStepsToCode } from "../harness/agent-harness";
import { createAuthContext } from "../harness/fixtures";
import {
  clearParticipants,
  restoreParticipants,
  resetGbToConfirmed,
  deleteInitiatedPayments,
  type ParticipantSnapshot,
} from "../harness/cleanup";
import { setGbStatus, getUserIdByLoginId, seedParticipant } from "../harness/seed";
import { orderFlowScenario } from "../scenarios/order-flow";
import { shipFlowScenario } from "../scenarios/ship-flow";
import { completeFlowScenario } from "../scenarios/complete-flow";

const USERS = {
  leader: { loginId: process.env.TEST_LEADER_ID!, password: process.env.TEST_LEADER_PW! },
  participant1: { loginId: process.env.TEST_PARTICIPANT1_ID!, password: process.env.TEST_PARTICIPANT1_PW! },
};

const GB_ID = process.env.CONFIRMED_GB_ID ?? "6a2e8a661d75894aad6d0b3e";
const DASHBOARD_URL = `/dashboard/leading/${GB_ID}`;

interface GeneratedBlock {
  name: string;
  gbStatus: string;
  contextVar: "leaderCtx" | "participantCtx";
  startUrl: string;
  actionCode: string;
  successSelector: string;
}

const generatedBlocks: GeneratedBlock[] = [];

test.describe("공구 전체 플로우 - AI 코드 생성기", () => {
  test.setTimeout(90_000);

  let leaderCtx: BrowserContext;
  let participantCtx: BrowserContext;
  let participantSnapshot: ParticipantSnapshot[] = [];

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(120_000);
    if (process.env.RUN_AI_AGENT !== "true") return;

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
    if (process.env.RUN_AI_AGENT !== "true") return;
    await restoreParticipants(GB_ID, participantSnapshot);
    await resetGbToConfirmed(GB_ID);
    await leaderCtx?.close();
    await participantCtx?.close();

    if (generatedBlocks.length > 0) {
      writeGeneratedSpec(generatedBlocks);
    }
  });

  test("1. 참여자 뷰 - CONFIRMED 상태에서 진행사항 확인 버튼", async () => {
    if (process.env.RUN_AI_AGENT !== "true") return;
    generatedBlocks.push({
      name: "1. 참여자 뷰 - CONFIRMED 상태에서 진행사항 확인 버튼",
      gbStatus: "CONFIRMED",
      contextVar: "participantCtx",
      startUrl: `/group-buying/detail/\${GB_ID}`,
      actionCode: "",
      successSelector: "role=button[name='진행사항 확인하기']",
    });
  });

  test("2. 총대 CONFIRMED → ORDERED (order-flow)", async () => {
    if (process.env.RUN_AI_AGENT !== "true") return;
    await setGbStatus(GB_ID, "CONFIRMED");
    const page = await leaderCtx.newPage();
    await page.goto(DASHBOARD_URL);
    const result = await runAgentLoop(page, orderFlowScenario);
    await page.close();
    if (result.status === "success") {
      generatedBlocks.push({
        name: "2. 총대 CONFIRMED → ORDERED",
        gbStatus: "CONFIRMED",
        contextVar: "leaderCtx",
        startUrl: DASHBOARD_URL,
        actionCode: recordedStepsToCode(result.recorded),
        successSelector: orderFlowScenario.successSelector,
      });
    }
  });

  test("3. 총대 ORDERED → SHIPPED (ship-flow)", async () => {
    if (process.env.RUN_AI_AGENT !== "true") return;
    await setGbStatus(GB_ID, "ORDERED");
    const page = await leaderCtx.newPage();
    await page.goto(DASHBOARD_URL);
    const result = await runAgentLoop(page, shipFlowScenario);
    await page.close();
    if (result.status === "success") {
      generatedBlocks.push({
        name: "3. 총대 ORDERED → SHIPPED",
        gbStatus: "ORDERED",
        contextVar: "leaderCtx",
        startUrl: DASHBOARD_URL,
        actionCode: recordedStepsToCode(result.recorded),
        successSelector: shipFlowScenario.successSelector,
      });
    }
  });

  test("4. 총대 SHIPPED → COMPLETED (complete-flow)", async () => {
    if (process.env.RUN_AI_AGENT !== "true") return;
    await setGbStatus(GB_ID, "SHIPPED");
    const page = await leaderCtx.newPage();
    await page.goto(DASHBOARD_URL);
    const result = await runAgentLoop(page, completeFlowScenario);
    await page.close();
    if (result.status === "success") {
      generatedBlocks.push({
        name: "4. 총대 SHIPPED → COMPLETED",
        gbStatus: "SHIPPED",
        contextVar: "leaderCtx",
        startUrl: DASHBOARD_URL,
        actionCode: recordedStepsToCode(result.recorded),
        successSelector: completeFlowScenario.successSelector,
      });
    }
  });
});

function writeGeneratedSpec(blocks: GeneratedBlock[]) {
  const GB_ID_VALUE = process.env.CONFIRMED_GB_ID ?? "6a2e8a661d75894aad6d0b3e";

  const testBlocks = blocks
    .map((b) => {
      const urlLine =
        b.startUrl === DASHBOARD_URL
          ? `    await page.goto(DASHBOARD_URL);`
          : `    await page.goto(\`${b.startUrl}\`);`;

      const actionLines = b.actionCode
        .split("\n")
        .filter(Boolean)
        .map((line) => `  ${line.trim()}`)
        .join("\n");

      return `
  test(${JSON.stringify(b.name)}, async () => {
    await setGbStatus(GB_ID, ${JSON.stringify(b.gbStatus)});
    const page = await ${b.contextVar}.newPage();
${urlLine}
${actionLines}
    await expect(page.locator(${JSON.stringify(b.successSelector)}).first()).toBeVisible({ timeout: 10000 });
    await page.close();
  });`;
    })
    .join("\n");

  const content = `/**
 * AI가 생성한 정적 Playwright 스크립트입니다.
 * 이 파일은 full-flow.ai.spec.ts를 RUN_AI_AGENT=true로 실행하면 자동 갱신됩니다.
 * CI에서는 이 파일만 실행합니다 (AI 없음).
 * 마지막 생성: ${new Date().toISOString()}
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

const GB_ID = process.env.CONFIRMED_GB_ID ?? ${JSON.stringify(GB_ID_VALUE)};
const DASHBOARD_URL = \`/dashboard/leading/\${GB_ID}\`;

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
${testBlocks}
});
`;

  const outPath = path.resolve(__dirname, "full-flow.spec.ts");
  fs.writeFileSync(outPath, content, "utf-8");
  console.log(`[GENERATOR] full-flow.spec.ts 생성 완료: ${outPath}`);
}
