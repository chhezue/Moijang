// src/components/CreateButton.tsx
"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import {
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

type Props = {
  /** 로그인 후 이동할 생성 페이지 경로 */
  redirectPath?: string; // 기본: "/create"
  /** 로그인 페이지 경로 (백엔드가 복귀 처리하면 그대로 두면 됨) */
  loginPath?: string; // 기본: "/login"
  size?: "small" | "medium" | "large";
};

export default function CreateButton({
  redirectPath = "/create",
  loginPath = "/login",
  size = "small",
}: Props) {
  const router = useRouter();
  const user = useSelector((s: RootState) => s.common.user);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    console.log("user clicked:", user);
    if (user) router.push(redirectPath);
    else setOpen(true);
  };

  return (
    <>
      <IconButton
        size={size}
        color="primary"
        onClick={handleClick}
        sx={(theme) => ({
          backgroundColor: theme.palette.primary.main,
          color: "#fff",
          "&:hover": { backgroundColor: theme.palette.primary.dark },
        })}
        aria-label="공동구매 생성"
      >
        <AddIcon
          fontSize={
            size === "small" ? "small" : size === "large" ? "large" : "medium"
          }
        />
      </IconButton>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>로그인이 필요합니다</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            공동구매를 생성하려면 먼저 로그인해 주세요.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpen(false);
              router.push(loginPath); // 백엔드가 복귀 경로 결정 중이면 콜백 불필요
            }}
          >
            로그인
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
