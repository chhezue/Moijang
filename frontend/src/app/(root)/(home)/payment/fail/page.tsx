"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Typography, Button } from "@mui/material";

function FailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get("message") ?? "결제가 실패했습니다.";

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <Typography variant="h6" color="error">
        결제 실패
      </Typography>
      <Typography color="text.secondary">{message}</Typography>
      <Button variant="contained" onClick={() => router.back()}>
        돌아가기
      </Button>
    </Box>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense>
      <FailContent />
    </Suspense>
  );
}
