export interface University {
  id: string;
  name: string;
  domain: string;
  campusType: string;
  region: string;
}

// 요청 타입
export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface SignupRequest {
  loginId: string;
  password: string;
  name: string;
  signupToken: string;
}

export interface SendCodeRequest {
  universityId: string;
  universityEmail: string;
}

export interface ConfirmCodeRequest {
  verificationToken: string;
  code: string;
}

// 아이디 중복 검사


// 응답 타입
export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  email: string;
}

export interface SignupResponse {
  loginId: string;
  name: string;
  universityEmail: string;
  universityId: string;
  universityName: string;
}

export interface SendCodeResponse {
  verificationToken: string; // jwe
  message: string; // 인증코드 전송 완료
}

export interface ConfirmCodeResponse {
  signupToken: string;
}

// 신원 확인
export interface CheckUsernameResponse {
  available: boolean;
}

// 이메일 중복검사 응답