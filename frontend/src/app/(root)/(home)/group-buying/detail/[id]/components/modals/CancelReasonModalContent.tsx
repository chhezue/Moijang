"use client";

import React, { useState } from "react";
import styled from "styled-components";
import {
  Button,
  Box,
  CircularProgress,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  alpha,
} from "@mui/material";
import { theme } from "@/styles/theme";

// 컨테이너 스타일
const Container = styled.div`
  width: 420px;
`;

const Wrapper = styled.div`
  margin-bottom: 10px;
`;

// 취소 사유 enum 값 + UI 설정
const CancelReasonConfig: Record<string, { label: string }> = {
  PRODUCT_UNAVAILABLE: {
    label: "상품이 품절되었거나 가격이 변동되었어요.",
  },
  RECRUITMENT_FAILED: {
    label: "모집 인원이 부족해요.",
  },
  LEADER_CANCELLED: {
    label: "개인적인 사정이에요.",
  },
};

interface Props {
  onConfirm: (reason: string) => void;
  visibleReasons?: string[]; // 필요한 경우 특정 사유만 노출
}

const CancelReasonModalContent = ({
  onConfirm,
  visibleReasons = Object.keys(CancelReasonConfig),
}: Props) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason || !isAgreed) return;
    setIsLoading(true);
    try {
      await onConfirm(selectedReason);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Wrapper>
        <Typography variant="body2" fontWeight={600} gutterBottom mt={1}>
          🚫 취소 사유를 선택해주세요.
        </Typography>

        <RadioGroup value={selectedReason} onChange={(e) => setSelectedReason(e.target.value)}>
          {visibleReasons.map((reason) => {
            const config = CancelReasonConfig[reason];
            if (!config) return null;

            return (
              <Box key={reason} ml={2}>
                <FormControlLabel
                  value={reason}
                  control={<Radio />}
                  label={
                    <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
                      {config.label}
                    </Typography>
                  }
                  sx={{
                    "& .MuiFormControlLabel-label": {
                      fontSize: "0.85rem",
                    },
                  }}
                />
              </Box>
            );
          })}
        </RadioGroup>
      </Wrapper>

      {/* 안내문 */}
      <Box my={3}>
        <Box
          sx={{
            p: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderLeft: `4px solid ${theme.palette.primary.main}`,
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              fontSize: "0.875rem",
              color: "text.secondary",
              lineHeight: 1.6,
            }}
          >
            확인을 누르면 공동구매가 취소되고, 팀원들에게 즉시 안내돼요.
          </Typography>
        </Box>

        {/* 동의 체크박스 */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Typography variant="body2" color="text.primary">
              위 유의사항을 확인했으며 동의합니다.
            </Typography>
          }
          sx={{ mt: 1 }}
        />
      </Box>

      {/* 버튼 영역 */}
      <Box display="flex" gap={1} mt={3}>
        <Button
          variant="contained"
          color="error"
          fullWidth
          onClick={handleConfirm}
          disabled={!selectedReason || !isAgreed || isLoading}
          sx={{
            fontSize: "0.85rem",
            py: 1.2,
            fontWeight: 600,
          }}
        >
          {isLoading ? <CircularProgress size={18} color="inherit" /> : "취소 진행하기"}
        </Button>
      </Box>
    </Container>
  );
};

export default CancelReasonModalContent;
