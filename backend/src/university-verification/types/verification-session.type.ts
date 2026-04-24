export interface VerificationSession {
  universityId: string; // 이메일 인증을 진행할 대학교 MongoId
  universityEmail: string; // 사용자가 입력한 이메일 전체
  codeHash: string; // 해시된 이메일 인증 코드
  attemptCount: number; // 인증 시도 횟수
  status: "PENDING" | "LOCKED"; // 인증 진행 중, 시도 횟수 초과로 잠금
}

export interface UpdateVerificationSession {
  attemptCount: number; // 인증 시도 횟수
  status: "PENDING" | "LOCKED"; // 인증 진행 중, 시도 횟수 초과로 잠금
}
