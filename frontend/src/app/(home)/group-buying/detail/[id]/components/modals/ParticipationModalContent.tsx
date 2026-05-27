"use client";
import React, { useState } from "react";
import TextInput from "@/components/TextInput";
import styled from "styled-components";
import { Button, Box, Typography, alpha } from "@mui/material";
import { joinParticipant } from "@/apis/services/participant";
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
  const { showSnackbar } = useSnackbar();
  const router = useRouter();

  const register = async () => {
    try {
      const data = await joinParticipant({ gbId, count });
      console.log(data);
      showSnackbar("공구 참여가 완료되었습니다.", "success");
      close();
      router.refresh();
    } catch (e: any) {
      console.log(e);
      showSnackbar(e.response?.data?.message ?? "참여에 실패했습니다.", "error");
    }
  };

  return (
    <Container>
      {/* 제목과 설명 섹션 */}
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
          sx={{
            fontSize: "0.9rem",
            color: "text.primary",
          }}
        >
          🎯 공구 참여 신청
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.8rem",
            color: "text.secondary",
            lineHeight: 1.4,
            mb: 1,
          }}
        >
          참여할 수량을 입력해주세요.
        </Typography>
      </Box>

      <Wrapper>
        <Label>수량</Label>
        <TextInput
          type="number"
          min={1}
          max={remainingCount}
          value={count.toString()}
          onChange={(e) => {
            setCount(Number(e.target.value));
          }}
          onBlur={() => {
            if (count < 1) setCount(1);
            if (count > remainingCount) setCount(remainingCount);
          }}
        />
      </Wrapper>

      <Button
        variant="contained"
        fullWidth
        onClick={() => {
          register().then();
        }}
      >
        확인 및 참여
      </Button>
    </Container>
  );
};

export default ParticipationModalContent;
