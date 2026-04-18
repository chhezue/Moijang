import apiClient from "@/apis/apiClient";
import type {
  LoginRequest,
  SignupRequest,
  SignupResponse,
  SendCodeRequest,
  ConfirmCodeRequest,
  UserDto,
  University,
  CheckUsernameResponse,
  ConfirmCodeResponse,
  SendCodeResponse
} from "@/types/auth";

export const login = async (data: LoginRequest): Promise<void> => {
  await apiClient.post("/api/auth/login", data);
};

export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const res = await apiClient.post("/api/auth/signup", data);
  return res.data;
};

// id 중복 확인
// export const checkDuplicateUsername = async (
//   username: string
// ): Promise<CheckUsernameResponse> => {
//   const res = await apiClient.get("/api/auth/check-username", {
//     params: { username },
//   });
//   return res.data;
// };

export const sendCode = async (
  data: SendCodeRequest
): Promise<SendCodeResponse> => {
  const res = await apiClient.post("/api/university-verification/send-code", data);
  return res.data;
};

export const confirmCode = async (
  data: ConfirmCodeRequest
): Promise<ConfirmCodeResponse> => {
  const res = await apiClient.post("/api/university-verification/confirm-code", data);
  return res.data;
};

export const searchUniversity = async (keyword: string): Promise<University[]> => {
  const res = await apiClient.get("/api/university", { params: { keyword } });
  return res.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/api/auth/logout");
};

export const getMyInfo = async (): Promise<UserDto> => {
  const res = await apiClient.get("/api/auth/me");
  return res.data;
};

