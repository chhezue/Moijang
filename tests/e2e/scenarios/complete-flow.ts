import { Scenario } from "../harness/agent-harness";

export const completeFlowScenario: Scenario = {
  goal: "data-testid='btn-complete' 버튼을 클릭하고, 확인 모달에서 data-testid='btn-modal-confirm' 버튼을 눌러 COMPLETED 상태로 전환한다.",
  successSelector: "text=성공적으로 끝났어요",
  forbiddenSelectors: ["text=오류가 발생", "text=공구 완료 처리 실패"],
  maxSteps: 5,
  allowedActions: ["click", "wait"],
};
