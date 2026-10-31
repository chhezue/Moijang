import axios from "axios";
import apiClient from "@/apis/apiClient";
import type {
  LoginRequest,
  SignupRequest,
  SignupResponse,
  SendCodeRequest,
  ConfirmCodeRequest,
  UserDto,
  University,
  ConfirmCodeResponse,
  SendCodeResponse,
} from "@/types/auth";

export const AUTH_QUERY_KEY = ["me"] as const;

// 401(미인증)은 null로, 그 외(네트워크 오류/5xx 등)는 호출부로 던져서 로그아웃으로 오판하지 않게 함
export const getMyInfo = async (): Promise<UserDto | null> => {
  try {
    const res = await apiClient.get<UserDto>("/api/auth/me");
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null;
    throw error;
  }
};

export const login = async (data: LoginRequest): Promise<UserDto> => {
  const res = await apiClient.post("/api/auth/login", data);
  return res.data;
};

export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const res = await apiClient.post("/api/auth/signup", data);
  return res.data;
};

// id 중복 확인
export const checkLoginId = async (loginId: string): Promise<boolean> => {
  const res = await apiClient.get<boolean>(`/api/auth/exist/${loginId}`);
  return !res.data;
};

export const sendCode = async (data: SendCodeRequest): Promise<SendCodeResponse> => {
  const res = await apiClient.post("/api/verification/send-code", data);
  return res.data;
};

export const confirmCode = async (data: ConfirmCodeRequest): Promise<ConfirmCodeResponse> => {
  const res = await apiClient.post("/api/verification/confirm-code", data);
  return res.data;
};

export const searchUniversity = async (keyword: string): Promise<University[]> => {
  const res = await apiClient.get("/api/university", { params: { keyword } });
  return res.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/api/auth/logout");
};
