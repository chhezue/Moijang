import { Scenario } from "../harness/agent-harness";

export const shipFlowScenario: Scenario = {
  goal: "순서대로 실행하라: 1) [data-testid='btn-shipped'] 클릭 → 2) [data-testid='input-pickup-time']에 '2026-12-01 18:00' 입력 → 3) [data-testid='input-pickup-place']에 '정문 앞' 입력 → 4) [data-testid='btn-shipped-submit'] 클릭. 이미 완료한 단계는 반복하지 마라.",
  successSelector: "[data-testid='btn-complete']",
  forbiddenSelectors: ["text=오류가 발생", "text=배송 상태 변경에 실패"],
  maxSteps: 7,
  allowedActions: ["click", "fill", "wait"],
};
