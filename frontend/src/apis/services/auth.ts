import apiClient from '@/apis/apiClient';
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
} from '@/types/auth';

export const login = async (data: LoginRequest): Promise<UserDto> => {
  const res = await apiClient.post('/api/auth/login', data);
  return res.data;
};

export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const res = await apiClient.post('/api/auth/signup', data);
  return res.data;
};

// id 중복 확인
export const checkLoginId = async (loginId: string): Promise<boolean> => {
  const res = await apiClient.get<boolean>(`/api/auth/exist/${loginId}`);
  return !res.data;
};

export const sendCode = async (data: SendCodeRequest): Promise<SendCodeResponse> => {
  const res = await apiClient.post('/api/verification/send-code', data);
  return res.data;
};

export const confirmCode = async (data: ConfirmCodeRequest): Promise<ConfirmCodeResponse> => {
  const res = await apiClient.post('/api/verification/confirm-code', data);
  return res.data;
};

export const searchUniversity = async (keyword: string): Promise<University[]> => {
  const res = await apiClient.get('/api/university', { params: { keyword } });
  return res.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};
