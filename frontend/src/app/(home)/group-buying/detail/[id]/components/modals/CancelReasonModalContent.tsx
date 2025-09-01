"use client";

import React, { useState } from "react";
import styled from "styled-components";
import {
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  Checkbox,
  alpha,
} from "@mui/material";
import { IParticipant } from "@/apis/interfaces";
import { theme } from "@/styles/theme";

// 컨테이너 스타일
const Container = styled.div`
  width: 420px;
`;

const Wrapper = styled.div`
  margin-bottom: 10px;
`;

// 취소 사유 enum 값 + UI 설정
const CancelReasonConfig: Record<
  string,
  { label: string; needParticipant?: boolean }
> = {
  PAYMENT_FAILED: {
    label: "팀원 중 입금하지 않은 사람이 있어요.",
    needParticipant: true,
  },
  PRODUCT_UNAVAILABLE: {
    label: "상품이 품절되었거나 가격이 변동되었어요.",
  },
  LEADER_CANCELLED: {
    label: "개인적인 사정이에요.",
  },
};

interface Props {
  participants: IParticipant[];
  onConfirm: (reason: string, participantId?: string[]) => void;
  visibleReasons?: string[]; // 필요한 경우 특정 사유만 노출
}

const CancelReasonModalContent = ({
  participants,
  onConfirm,
  visibleReasons = Object.keys(CancelReasonConfig),
}: Props) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [selectedParticipantList, setSelectedParticipantList] = useState<
    string[]
  >([]);
  const [isAgreed, setIsAgreed] = useState(false);

  const handleConfirm = () => {
    if (!selectedReason || !isAgreed) return;
    onConfirm(selectedReason, selectedParticipantList || undefined);
  };

  return (
    <Container>
      <Wrapper>
        <Typography variant="body2" fontWeight={600} gutterBottom mt={1}>
          🚫 취소 사유를 선택해주세요.
        </Typography>

        <RadioGroup
          value={selectedReason}
          onChange={(e) => setSelectedReason(e.target.value)}
        >
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

                {/* 참가자 선택 UI */}
                {selectedReason === reason && config.needParticipant && (
                  <Box
                    sx={{
                      ml: 2,
                      mb: 1,
                      p: 2,
                      bgcolor: "grey.50",
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      display="block"
                      gutterBottom
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "text.primary",
                        mb: 1,
                      }}
                    >
                      어떤 팀원이 입금하지 않았나요?
                    </Typography>
                    <Select
                      multiple
                      size="small"
                      fullWidth
                      value={selectedParticipantList}
                      onChange={(e) =>
                        setSelectedParticipantList(e.target.value as string[])
                      }
                      renderValue={(selected) =>
                        (selected as string[])
                          .map(
                            (id) =>
                              participants.find((p) => p.id === id)?.userId
                                .displayName
                          )
                          .join(", ")
                      }
                      sx={{
                        "& .MuiSelect-select": { fontSize: "0.8rem" },
                        "& .MuiMenuItem-root": { fontSize: "0.8rem" },
                      }}
                    >
                      {participants.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          <Checkbox
                            checked={selectedParticipantList.indexOf(p.id) > -1}
                            size="small"
                          />
                          <Typography
                            variant="body2"
                            sx={{ fontSize: "0.8rem" }}
                          >
                            {p.userId.displayName}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                )}
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
            <br />
            <strong>취소 후, 입금한 팀원들에게 환불을 진행해주세요.</strong>
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
          disabled={!selectedReason || !isAgreed}
          sx={{
            fontSize: "0.85rem",
            py: 1.2,
            fontWeight: 600,
          }}
        >
          취소 진행하기
        </Button>
      </Box>
    </Container>
  );
};

export default CancelReasonModalContent;
