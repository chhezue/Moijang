"use client";

import { Box, Button, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";
import { SignupResponse } from "@/types/auth";

interface Props {
  result: SignupResponse;
}

export default function StepComplete({ result }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, py: 2 }}>
      <CheckCircleIcon sx={{ fontSize: 56, color: "success.main" }} />

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" fontWeight={600}>
          환영합니다, {result.name}님!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {result.universityName} 학생으로 가입이 완료되었습니다.
        </Typography>
      </Box>

      <Button component={Link} href="/login" variant="contained" fullWidth sx={{ mt: 1 }}>
        로그인 하러 가기
      </Button>
    </Box>
  );
}
