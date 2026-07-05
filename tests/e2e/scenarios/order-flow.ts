import { Scenario } from "../harness/agent-harness";

export const orderFlowScenario: Scenario = {
  goal: "data-testid='btn-order' 버튼을 클릭하고, 확인 모달에서 data-testid='btn-modal-confirm' 버튼을 눌러 ORDERED 상태로 전환한다.",
  successSelector: "[data-testid='btn-shipped']",
  forbiddenSelectors: ["text=오류가 발생", "text=상태 변경에 실패"],
  maxSteps: 5,
  allowedActions: ["click", "wait"],
};
