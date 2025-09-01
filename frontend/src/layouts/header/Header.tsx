"use client";
import { useSelector } from "react-redux";
import React, { useEffect, useState } from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { logout } from "@/apis/services/auth";
import { CLEAR_USER } from "@/redux/slice/commonSlice";
import { useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import LoginIcon from "@mui/icons-material/Login";
import CreateButton from "@/components/CreateButton";
import UserMenu from "@/components/UserMenu";

const useScrollFlag = (threshold = 8) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
};

function useHeaderStyles() {
  const theme = useTheme();
  const scrolled = useScrollFlag();

  return {
    width: "100%",
    height: 68,
    position: "sticky" as const,
    top: 0,
    left: 0,
    zIndex: 999,
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition:
      "background-color 240ms ease, box-shadow 240ms ease, border-color 240ms ease",
    display: "flex",
    alignItems: "center",
    background: scrolled
      ? theme.palette.background.paper
      : "linear-gradient(180deg, rgba(139,92,246,0.06), rgba(139,92,246,0.02))",
    backdropFilter: scrolled ? "none" : "blur(10px)",
  };
}

const Header: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const styles = useHeaderStyles();
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.common.user);

  const onLogout = async () => {
    try {
      await logout();
      dispatch(CLEAR_USER());
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  const onLogin = () => {
    router.push("/login");
  };

  return (
    <Box component="header" sx={styles}>
      <Box
        sx={{
          width: "100%",
          maxWidth: 1200,
          height: "100%",
          mx: "auto",
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 좌측 로고 */}
        <Box
          onClick={() => router.push("/")}
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* 모던한 아이콘 */}
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.24)",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: "white",
                fontWeight: 800,
                fontSize: "1rem",
                letterSpacing: "-0.02em",
              }}
            >
              M
            </Typography>
          </Box>

          {/* 세련된 워드마크 */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: "1.5rem",
              letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #8B5CF6, #374151)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MOIJANG
          </Typography>
        </Box>

        {/* 우측 사용자 메뉴 */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {user && <UserMenu displayName={user.displayName} />}

          {/* 공구 생성 버튼 */}
          <CreateButton />

          {user ? (
            <Button
              variant="outlined"
              size="small"
              onClick={onLogout}
              startIcon={<LogoutOutlinedIcon />}
              sx={{
                fontSize: "0.75rem",
                padding: "6px 10px",
                borderRadius: 999,
              }}
            >
              로그아웃
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={onLogin}
              startIcon={<LoginIcon />}
              sx={{
                fontSize: "0.75rem",
                padding: "6px 10px",
                borderRadius: 999,
              }}
            >
              로그인
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

export default Header;
