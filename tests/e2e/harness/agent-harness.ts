import Anthropic from "@anthropic-ai/sdk";
import { Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export interface Scenario {
  goal: string;
  successSelector: string;
  forbiddenSelectors: string[];
  maxSteps: number;
  allowedActions: Array<"click" | "goto" | "fill" | "wait">;
}

interface AgentAction {
  action: "click" | "goto" | "fill" | "wait";
  selector?: string;
  url?: string;
  value?: string;
  reason: string;
}

interface RecordedStep {
  type: "click" | "fill" | "goto" | "wait";
  selector?: string;
  value?: string;
  url?: string;
  inDialog: boolean;
}

export interface RunResult {
  status: "success" | "failure" | "timeout" | "skipped";
  steps: number;
  reason: string;
  recorded: RecordedStep[];
  usage?: { inputTokens: number; outputTokens: number; estimatedCostUsd: number };
}

const PRICE_INPUT = 3.0;
const PRICE_OUTPUT = 15.0;

let sessionInputTokens = 0;
let sessionOutputTokens = 0;

function logUsage(input: number, output: number) {
  sessionInputTokens += input;
  sessionOutputTokens += output;
  const callCost = (input * PRICE_INPUT + output * PRICE_OUTPUT) / 1_000_000;
  const sessionCost =
    (sessionInputTokens * PRICE_INPUT + sessionOutputTokens * PRICE_OUTPUT) / 1_000_000;
  console.log(
    `[AGENT] 토큰: in=${input} out=${output} | 호출비용: $${callCost.toFixed(4)} | 세션누적: $${sessionCost.toFixed(4)}`,
  );
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function collectElements(page: Page): Promise<string[]> {
  return page.$$eval(
    "button:not([disabled]), a[href], input:not([disabled]), select, [role='button'], [role='link']",
    (els) =>
      els.map((el) => {
        const tag = el.tagName.toLowerCase();
        const text = (el.textContent ?? "").trim().slice(0, 50);
        const role = el.getAttribute("role") ?? "";
        const name = el.getAttribute("aria-label") ?? el.getAttribute("name") ?? "";
        const href = (el as HTMLAnchorElement).href ?? "";
        const testId = el.getAttribute("data-testid") ?? "";
        return [
          tag,
          role,
          name,
          text,
          href,
          testId ? `[data-testid=${testId}]` : "",
        ]
          .filter(Boolean)
          .join(" | ");
      }),
  );
}

function validateAction(action: AgentAction, scenario: Scenario): string | null {
  if (!scenario.allowedActions.includes(action.action)) {
    return `action "${action.action}" not in allowedActions`;
  }
  if (action.action === "click" && !action.selector) return "click requires selector";
  if (action.action === "fill" && (!action.selector || !action.value))
    return "fill requires selector + value";
  if (action.action === "goto" && !action.url) return "goto requires url";
  return null;
}

async function waitForRender(page: Page, urlBefore: string): Promise<void> {
  const urlChanged = await page
    .waitForURL((url) => url.href !== urlBefore, { timeout: 2000 })
    .then(() => true)
    .catch(() => false);

  if (urlChanged) {
    await page.waitForLoadState("load", { timeout: 5000 }).catch(() => {});
    return;
  }

  const dialogOpened = await page
    .locator('[role="dialog"]')
    .waitFor({ state: "visible", timeout: 2000 })
    .then(() => true)
    .catch(() => false);

  if (dialogOpened) return;

  await page.waitForTimeout(800);
}

export function recordedStepsToCode(steps: RecordedStep[]): string {
  return steps
    .map((s) => {
      if (s.type === "click") {
        const sel = JSON.stringify(s.selector);
        if (s.inDialog) {
          return `  await page.locator('[role="dialog"]').locator(${sel}).click();`;
        }
        return `  await page.locator(${sel}).click();`;
      }
      if (s.type === "fill") {
        const sel = s.selector!;
        const val = JSON.stringify(s.value);
        // data-testid selector면 locator, 아니면 getByLabel
        const isTestId = sel.startsWith("[data-testid");
        const selExpr = isTestId ? `page.locator(${JSON.stringify(sel)})` : `page.getByLabel(${JSON.stringify(sel)})`;
        if (s.inDialog && !isTestId) {
          return `  await page.locator('[role="dialog"]').getByLabel(${JSON.stringify(sel)}).fill(${val});`;
        }
        return `  await ${selExpr}.fill(${val});`;
      }
      if (s.type === "goto") {
        return `  await page.goto(${JSON.stringify(s.url)});`;
      }
      return `  await page.waitForTimeout(1000);`;
    })
    .join("\n");
}

export async function runAgentLoop(page: Page, scenario: Scenario): Promise<RunResult> {
  if (process.env.RUN_AI_AGENT !== "true") {
    console.log("[AGENT] skipped — RUN_AI_AGENT 미설정");
    return { status: "skipped", steps: 0, reason: "RUN_AI_AGENT not set", recorded: [] };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      status: "failure",
      steps: 0,
      reason: "ANTHROPIC_API_KEY 없음",
      recorded: [],
    };
  }

  let totalInput = 0;
  let totalOutput = 0;
  const recorded: RecordedStep[] = [];

  const debugDir = path.resolve(__dirname, "../../../test-results/agent-debug");
  fs.mkdirSync(debugDir, { recursive: true });
  const scenarioName = scenario.goal.slice(0, 20).replace(/[\s/]/g, "_");

  for (let step = 0; step < scenario.maxSteps; step++) {
    const screenshot = await page.screenshot({
      type: "png",
      scale: "css",
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
    const elements = await collectElements(page);
    const currentUrl = page.url();

    fs.writeFileSync(path.join(debugDir, `${scenarioName}_step${step}.png`), screenshot);
    console.log(`[AGENT] step ${step} | url: ${currentUrl} | 요소 ${elements.length}개`);
    console.log(`[AGENT] step ${step} | 상위요소: ${elements.slice(0, 5).join(" / ")}`);

    if (
      await page
        .locator(scenario.successSelector)
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false)
    ) {
      const estimatedCostUsd =
        (totalInput * PRICE_INPUT + totalOutput * PRICE_OUTPUT) / 1_000_000;
      console.log(`[AGENT] ✅ 성공 (${step}스텝) | 총비용: $${estimatedCostUsd.toFixed(4)}`);
      return {
        status: "success",
        steps: step,
        reason: `found: ${scenario.successSelector}`,
        recorded,
        usage: { inputTokens: totalInput, outputTokens: totalOutput, estimatedCostUsd },
      };
    }

    for (const sel of scenario.forbiddenSelectors) {
      if (await page.locator(sel).isVisible({ timeout: 500 }).catch(() => false)) {
        return { status: "failure", steps: step, reason: `forbidden: ${sel}`, recorded };
      }
    }

    let response;
    try {
      response = await client.messages.create(
        {
          model: process.env.AI_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 512,
          system: `당신은 웹 UI 테스트 에이전트입니다. 현재 화면을 보고 목표 달성을 위한 다음 액션을 선택하세요.

selector 우선순위:
1. data-testid 있으면 최우선 사용: "[data-testid='btn-order']"
2. 없으면 텍스트 기반: "button:has-text('확인')", "text=주문하러 가기"
3. fill 액션 selector: data-testid 있으면 "[data-testid='input-pickup-time']", 없으면 label 텍스트
4. 태그 단독("button", "input")은 절대 사용 금지
5. 이미 완료한 단계(값이 이미 입력됨, 버튼을 이미 클릭함)는 절대 반복하지 마라. 다음 단계로 진행해라.`,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/png",
                    data: screenshot.toString("base64"),
                  },
                },
                {
                  type: "text",
                  text: [
                    `목표: ${scenario.goal}`,
                    `현재 URL: ${currentUrl}`,
                    `인터랙티브 요소:\n${elements.map((e, i) => `${i + 1}. ${e}`).join("\n")}`,
                    `허용 액션: ${scenario.allowedActions.join(", ")}`,
                  ].join("\n"),
                },
              ],
            },
          ],
          tools: [
            {
              name: "choose_next_action",
              description: "목표 달성을 위한 다음 UI 액션을 선택합니다.",
              input_schema: {
                type: "object" as const,
                properties: {
                  action: { type: "string", enum: scenario.allowedActions },
                  selector: {
                    type: "string",
                    description: "click: 'button:has-text(텍스트)' / fill: label 텍스트",
                  },
                  url: { type: "string", description: "이동할 URL (goto 시 필수)" },
                  value: { type: "string", description: "입력값 (fill 시 필수)" },
                  reason: { type: "string", description: "이 액션을 선택한 이유" },
                },
                required: ["action", "reason"],
              },
            },
          ],
          tool_choice: { type: "tool", name: "choose_next_action" },
        },
        { timeout: 90_000 },
      );
    } catch (e) {
      return {
        status: "failure",
        steps: step,
        reason: `API 오류: ${(e as Error).message}`,
        recorded,
      };
    }

    const usage = response.usage;
    totalInput += usage.input_tokens;
    totalOutput += usage.output_tokens;
    logUsage(usage.input_tokens, usage.output_tokens);

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return {
        status: "failure",
        steps: step,
        reason: "Claude did not return tool_use",
        recorded,
      };
    }
    const agentAction = toolUse.input as AgentAction;

    const validationError = validateAction(agentAction, scenario);
    if (validationError) {
      return {
        status: "failure",
        steps: step,
        reason: `validation: ${validationError}`,
        recorded,
      };
    }

    console.log(`[AGENT] step ${step + 1}: ${agentAction.action} — ${agentAction.reason}`);

    const urlBefore = page.url();
    const inDialog = await page
      .locator('[role="dialog"]')
      .isVisible({ timeout: 300 })
      .catch(() => false);

    try {
      if (agentAction.action === "click") {
        const dialog = page.locator('[role="dialog"]');
        const target = inDialog
          ? dialog.locator(agentAction.selector!)
          : page.locator(agentAction.selector!);
        await target.click({ timeout: 5000 });
        recorded.push({ type: "click", selector: agentAction.selector, inDialog });
      } else if (agentAction.action === "goto") {
        await page.goto(agentAction.url!);
        recorded.push({ type: "goto", url: agentAction.url, inDialog: false });
      } else if (agentAction.action === "fill") {
        const sel = agentAction.selector!;
        const val = agentAction.value!;
        const isTestId = sel.startsWith("[data-testid");
        if (isTestId) {
          await page.locator(sel).fill(val);
        } else if (inDialog) {
          const dialogEl = page.locator('[role="dialog"]');
          if ((await dialogEl.getByLabel(sel).count()) > 0) {
            await dialogEl.getByLabel(sel).fill(val);
          } else {
            await dialogEl.getByPlaceholder(sel).fill(val);
          }
        } else {
          if ((await page.getByLabel(sel).count()) > 0) {
            await page.getByLabel(sel).fill(val);
          } else if ((await page.getByPlaceholder(sel).count()) > 0) {
            await page.getByPlaceholder(sel).fill(val);
          } else {
            await page.locator(sel).fill(val);
          }
        }
        recorded.push({ type: "fill", selector: sel, value: val, inDialog });
      } else if (agentAction.action === "wait") {
        await page.waitForTimeout(1000);
        // wait는 코드에 포함하지 않음 (불필요)
      }
    } catch (e) {
      return {
        status: "failure",
        steps: step,
        reason: `execute failed: ${(e as Error).message}`,
        recorded,
      };
    }

    await waitForRender(page, urlBefore);
  }

  return {
    status: "timeout",
    steps: scenario.maxSteps,
    reason: `maxSteps(${scenario.maxSteps}) 초과`,
    recorded,
  };
}
