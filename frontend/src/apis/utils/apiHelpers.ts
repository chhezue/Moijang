import { AxiosError } from "axios";

export const handleApiError = (error: AxiosError) => {
  if (error.response) {
    console.error("서버 에러", error.response.data);
  } else if (error.request) {
    console.error("응답 없음", error.request);
  } else {
    console.error("예외 에러", error.message);
  }
};
