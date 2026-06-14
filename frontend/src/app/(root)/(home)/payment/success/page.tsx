"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import { confirmPayment } from "@/apis/services/payment";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const paymentKey = searchParams.get("paymentKey") ?? "";
    const orderId = searchParams.get("orderId") ?? "";
    const amount = Number(searchParams.get("amount") ?? "0");
    const gbId = searchParams.get("gbId") ?? "";

    confirmPayment({ paymentKey, orderId, amount })
      .then(() => {
        router.replace(`/group-buying/detail/${gbId}?joined=true`);
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.message ?? "결제 확인 중 오류가 발생했습니다.");
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress />
        <Typography>결제 확인 중...</Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="60vh"
      gap={2}
    >
      <Typography color="error">{errorMsg}</Typography>
      <Button variant="outlined" onClick={() => router.back()}>
        뒤로 가기
      </Button>
    </Box>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
