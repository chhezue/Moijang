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
  verificationId: string;
  code: string;
}

// 응답 타입
export interface UserDto {
  id: string;
  loginId: string;
  name: string;
  universityEmail: string;
  universityId: string;
  universityName: string;
}

export type SignupResponse = UserDto;

export interface SendCodeResponse {
  verificationId: string;
}

export interface ConfirmCodeResponse {
  signupToken: string;
}
