"use client";
import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  alpha,
  SxProps,
} from "@mui/material";
import { IParticipant, GroupBuyingItem } from "@/apis/interfaces";
import { ModalType } from "@/app/(home)/group-buying/detail/[id]/components/types";
import { theme } from "@/styles/theme";
import { Theme } from "@mui/system";

interface Props {
  item: GroupBuyingItem;
  participants: IParticipant[];
  onConfirm: () => void;
  onOpenModal: (type: ModalType) => void;
}

interface InfoItemProps {
  label: string;
  value: string;
  sx: SxProps<Theme>;
  valueSx?: SxProps<Theme>;
}

const InfoItem = ({ label, value, sx, valueSx }: InfoItemProps) => (
  <Box
    sx={{
      flex: 1, // 부모의 공간을 균등하게 차지하도록 설정
      display: "flex",
      flexDirection: "column", // 내부 텍스트를 위아래로 배치
      gap: 0.5,
      textAlign: "center", // 텍스트 중앙 정렬
      py: 1.5,
      px: 2,
      borderRadius: 1.5,
      ...sx, // 커스텀 스타일 적용
    }}
  >
    <Typography
      variant="body2"
      sx={{ fontSize: "0.8rem", color: "text.secondary" }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        fontSize: "0.9rem",
        fontWeight: 600,
        color: "text.primary",
        ...valueSx, // 커스텀 값 스타일 적용
      }}
    >
      {value}
    </Typography>
  </Box>
);

const RequestPaymentModalContent = ({
  item,
  participants,
  onConfirm,
  onOpenModal,
}: Props) => {
  const [isAgreed, setIsAgreed] = useState(false);

  return (
    <Box sx={{ width: 420 }}>
      {/* 결제 요청 정보 */}
      <Box mb={3}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 20,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: "0.95rem",
              color: "text.primary",
            }}
          >
            1. 결제 요청 정보
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row", // 세로 정렬을 가로 정렬로 변경
            gap: 1.5, // 아이템 간의 간격
          }}
        >
          <InfoItem
            label="상품 총 가격"
            value={`${item.totalPrice.toLocaleString("ko-KR")}원`}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          />
          <InfoItem
            label="배송비"
            value={`${(item.shippingFee ?? 0).toLocaleString("ko-KR")}원`}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          />
          <InfoItem
            label="1개당 가격"
            value={`${item.estimatedPrice.toLocaleString("ko-KR")}원`}
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, 0.08),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
            }}
            valueSx={{ color: "secondary.dark" }}
          />
        </Box>
      </Box>

      {/* 참여자별 금액 */}
      <Box mb={3}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 20,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: "0.95rem",
              color: "text.primary",
            }}
          >
            2. 참여자별 금액
          </Typography>
        </Box>
        <Box
          sx={{
            maxHeight: 200,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            bgcolor: "background.paper",
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.grey[300], 0.3)}`,
            p: 1,
          }}
        >
          {participants.map((p, index) => (
            <Box
              key={p.id}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 1.5,
                bgcolor:
                  index % 2 === 0
                    ? alpha(theme.palette.grey[50], 0.5)
                    : "transparent",
              }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: theme.palette.primary.main,
                    opacity: 0.7,
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "text.primary",
                  }}
                >
                  {p.userId.displayName}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography
                  variant="body2"
                  sx={{ fontSize: "0.8rem", color: "text.secondary" }}
                >
                  {p.count}개
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "secondary.dark",
                  }}
                >
                  {(p.count * item.estimatedPrice).toLocaleString("ko-KR")}원
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 유의사항 및 동의 */}
      <Box mb={3}>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              width: 4,
              height: 20,
              bgcolor: theme.palette.primary.main,
              borderRadius: 1,
            }}
          />
          <Typography
            variant="subtitle1"
            fontWeight={600}
            sx={{
              fontSize: "0.95rem",
              color: "text.primary",
            }}
          >
            3. 유의사항 및 동의
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: alpha(theme.palette.secondary.light, 0.1),
            borderRadius: 1,
            mb: 2,
          }}
        >
          <Typography
            variant="body2"
            color="text.primary"
            sx={{
              display: "block",
              lineHeight: 1.6,
              fontSize: "0.75rem",
            }}
          >
            <strong style={{ color: theme.palette.error.main }}>
              [송금 요청 전 꼭 확인하세요!]
            </strong>
            <br />
            - 금액 확인: 요청 후에는 금액 변경이 불가해요. <br />- 입금 기한:{" "}
            <strong>요청 후 24시간 내</strong> <br />
            ※ 기한 내 1명이라도 미입금 시 공구는 자동 취소되고, 환불 절차가
            진행돼요.
            <br />※ 금액 차이가 크다면 먼저 팀원과 상의하는 것을 권장드려요.
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
        />
      </Box>

      {/* 버튼 */}
      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => onOpenModal("editPrice")}
          sx={{
            py: 1.2,
            fontWeight: 600,
            borderColor: theme.palette.grey[400],
            color: theme.palette.text.secondary,
            "&:hover": {
              borderColor: theme.palette.grey[600],
              bgcolor: alpha(theme.palette.grey[500], 0.04),
            },
          }}
        >
          가격 수정하기
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={onConfirm}
          disabled={!isAgreed}
          sx={{
            py: 1.2,
            fontWeight: 600,
            fontSize: "0.9rem",
            "&:disabled": {
              bgcolor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled,
            },
          }}
        >
          송금 요청 보내기
        </Button>
      </Box>
    </Box>
  );
};

export default RequestPaymentModalContent;
