import apiClient from "@/apis/apiClient";

export const redirectToLogin = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`;
};

export const logout = async () => {
  return await apiClient.post("/api/auth/logout");
};

export const getMyInfo = async () => {
  try {
    const response = await apiClient.get("/api/auth/me");
    return response.data;
  } catch (error) {
    // 401 에러를 포함한 모든 에러를 호출자에게 던집니다.
    throw error;
  }
};
