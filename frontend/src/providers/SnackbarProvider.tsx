"use client";
import React, {
  createContext,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useContext,
  useState,
} from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert, { AlertColor } from "@mui/material/Alert";

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor; // 'success' | 'info' | 'warning' | 'error'
  duration: number | null; // null이면 자동으로 닫히지 않음
}

// Context가 제공할 값의 인터페이스 (스낵바를 띄우는 함수)
interface SnackbarContextValue {
  showSnackbar: (
    message: string,
    severity?: AlertColor,
    duration?: number | null
  ) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined
);

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
    duration: 4000,
  });

  const showSnackbar = useCallback(
    (
      message: string,
      severity: AlertColor = "success",
      duration: number | null = 4000
    ) => {
      setSnackbar({ open: true, message, severity, duration });
    },
    []
  );
  // 3. 스낵바 닫기 함수 (useCallback으로 메모이제이션)
  const handleClose = useCallback(
    (event?: SyntheticEvent | Event, reason?: string) => {
      if (reason === "clickaway") {
        return;
      }
      // setSnackbar을 호출하여 open 상태를 false로 변경 -> 스낵바 닫기
      setSnackbar((prev) => ({ ...prev, open: false }));
    },
    []
  );
  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open} // 열림 상태를 내부 state와 연결
        autoHideDuration={snackbar.duration} // 자동 닫힘 시간 연결
        onClose={handleClose} // 닫기 이벤트 핸들러 연결
        anchorOrigin={{ vertical: "top", horizontal: "right" }} // 위치 설정
      >
        <Alert
          onClose={handleClose} // Alert 내부의 닫기 버튼 클릭 시에도 닫히도록
          severity={snackbar.severity} // Alert 종류(색상/아이콘) 연결
          variant="filled" // Alert 스타일 (채워진 스타일)
          sx={{ width: "100%" }} // 너비 100%
        >
          {snackbar.message} {/* 메시지 내용 표시 */}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// Context를 쉽게 사용하기 위한 커스텀 훅
export const useSnackbar = (): SnackbarContextValue => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};
