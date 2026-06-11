"use client";
import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import styled from "styled-components";
import { Button, Box, Typography, alpha } from "@mui/material";
import { checkout } from "@/apis/services/payment";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { useRouter } from "next/navigation";
import { theme } from "@/styles/theme";

const Label = styled.label`
  font-size: 13px;
`;
const Container = styled.div`
  width: 400px;
`;
const Wrapper = styled.div`
  margin-bottom: 15px;
`;

interface Props {
  gbId: string;
  close: () => void;
  remainingCount: number;
}

const ParticipationModalContent = ({ gbId, close, remainingCount }: Props) => {
  const [count, setCount] = useState<number>(1);
  const [countError, setCountError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCount(val);
    if (val > remainingCount) {
      setCountError(`목표 수량을 넘길 수 없습니다. (최대 ${remainingCount}개)`);
    } else if (val < 1) {
      setCountError("최소 1개 이상 입력해주세요.");
    } else {
      setCountError("");
    }
  };

  const handlePay = async () => {
    if (countError || count < 1 || count > remainingCount) return;

    setIsLoading(true);
    try {
      const checkoutData = await checkout({ gbId, count });
      const tossPayments = await loadTossPayments(checkoutData.clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: checkoutData.amount },
        orderId: checkoutData.orderId,
        orderName: checkoutData.orderName,
        successUrl: `${window.location.origin}/payment/success?gbId=${encodeURIComponent(gbId)}`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (e: any) {
      if (e?.code === "USER_CANCEL") {
        close();
        return;
      }
      const msg = e?.response?.data?.message ?? "결제 시작에 실패했습니다.";
      showSnackbar(msg, "error");
      // 정원 초과 에러면 최신 잔여 수량으로 갱신
      if (msg.includes("정원") || msg.includes("수량")) {
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          pl: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.05),
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          borderRadius: 1,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ fontSize: "0.9rem", color: "text.primary" }}
        >
          🎯 공구 참여 신청
        </Typography>
        <Typography
          variant="caption"
          sx={{ fontSize: "0.8rem", color: "text.secondary", lineHeight: 1.4 }}
        >
          수량 입력 후 토스 결제창에서 결제를 완료해 주세요.
        </Typography>
      </Box>

      <Wrapper>
        <Label>수량</Label>
        <TextInput
          type="number"
          min={1}
          max={remainingCount}
          value={count.toString()}
          onChange={handleCountChange}
        />
        {countError ? (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
            {countError}
          </Typography>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            현재 가능한 수량: {remainingCount}개
          </Typography>
        )}
      </Wrapper>

      <Button
        variant="contained"
        fullWidth
        onClick={handlePay}
        disabled={isLoading || !!countError || count < 1}
      >
        {isLoading ? "결제 준비 중..." : "결제하기"}
      </Button>
    </Container>
  );
};

export default ParticipationModalContent;
