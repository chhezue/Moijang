import apiClient from "@/apis/apiClient";
import type {
  LoginRequest,
  RegisterRequest,
  SendCodeRequest,
  VerifyCodeRequest,
  UserDto,
  CheckUsernameResponse,
  VerifyCodeResponse,
} from "@/types/auth";

export const login = async (data: LoginRequest): Promise<void> => {
  await apiClient.post("/api/auth/login", data);
};

export const register = async (data: RegisterRequest): Promise<void> => {
  await apiClient.post("/api/auth/register", data);
};

export const checkDuplicateUsername = async (
  username: string
): Promise<CheckUsernameResponse> => {
  const res = await apiClient.get("/api/auth/check-username", {
    params: { username },
  });
  return res.data;
};

export const sendVerificationCode = async (
  data: SendCodeRequest
): Promise<void> => {
  await apiClient.post("/api/auth/email/send", data);
};

export const verifyCode = async (
  data: VerifyCodeRequest
): Promise<VerifyCodeResponse> => {
  const res = await apiClient.post("/api/auth/email/verify", data);
  return res.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/api/auth/logout");
};

export const getMyInfo = async (): Promise<UserDto> => {
  const res = await apiClient.get("/api/auth/me");
  return res.data;
};

