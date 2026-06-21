"use client";

import React, { useState } from "react";
import { Box, Chip, Link, Paper, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LeaderInfoCard from "@/components/LeaderInfoCard";
import { GroupBuyingItem } from "@/types/groupBuying";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { useStatusContext } from "@/providers/StatusProvider";
import Stepper from "@/components/Stepper";
import NoticeBoard from "@/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/NoticeBoard";
import CustomModal from "@/components/CustomModal";
import ConfirmModalContent from "@/app/(root)/(home)/group-buying/detail/[id]/components/modals/ConfirmModalContent";
import { refundPayment } from "@/apis/services/payment";

interface ParticipantDashboardProps {
  item: GroupBuyingItem;
}

export default function ParticipantDashboard({ item }: ParticipantDashboardProps) {
  const { showSnackbar } = useSnackbar();
  const { statusList, statusToStepIndex } = useStatusContext();
  const router = useRouter();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const isCancelled = item.groupBuyingStatus === "CANCELLED";

  const handleCancelParticipation = async () => {
    try {
      await refundPayment({ gbId: item.id, cancelReason: "LEADER_CANCELLED" });
      showSnackbar("참여가 취소되고 환불이 처리되었습니다.", "success");
      router.push("/dashboard/participating");
    } catch {
      showSnackbar("참여 취소에 실패했습니다.", "error");
    }
  };

  return (
    <>
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        {/* 헤더 */}
        <Box sx={{ mb: 3 }}>
          <Link
            component="button"
            onClick={() => router.push(`/group-buying/detail/${item.id}`)}
            underline="hover"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5, fontSize: "0.8rem" }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            상세 페이지로
          </Link>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1}>
            <Typography variant="h5" fontWeight={700}>
              {item.title}
            </Typography>
            <Chip
              label="참여중"
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: "0.7rem" }}
            />
            {isCancelled && (
              <Chip label="취소됨" color="error" size="small" sx={{ fontWeight: 600 }} />
            )}
          </Stack>
        </Box>

        {/* 진행 단계 */}
        {!isCancelled && (
          <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
            <Stepper steps={statusList} activeStep={statusToStepIndex[item.groupBuyingStatus]} />
          </Paper>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* 총대 정보 */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              총대 정보
            </Typography>
            <LeaderInfoCard name={item.leaderId.name} count={item.leaderCount} variant="plain" />
          </Paper>

          {/* 공지사항 */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              공지사항
            </Typography>
            <NoticeBoard item={item} />
          </Paper>

          {/* 내 참여 정보 */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
              내 참여 정보
            </Typography>
            <Stack spacing={1}>
              <InfoRow label="구매 수량" value={`${item.participantInfo?.count ?? "-"}개`} />
              <InfoRow
                label="결제 금액"
                value={
                  item.participantInfo?.count
                    ? `${(item.estimatedPrice * item.participantInfo.count).toLocaleString()}원 (예상)`
                    : "-"
                }
              />
              <InfoRow label="마감일" value={new Date(item.endDate).toLocaleDateString("ko-KR")} />
              {item.pickupPlace && <InfoRow label="수령 장소" value={item.pickupPlace} />}
              {item.pickupTime && <InfoRow label="수령 시간" value={item.pickupTime} />}
            </Stack>

            {item.groupBuyingStatus === "RECRUITING" && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  label="참여 취소"
                  color="error"
                  variant="outlined"
                  onClick={() => setCancelModalOpen(true)}
                  sx={{ cursor: "pointer", fontWeight: 600 }}
                />
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      <CustomModal
        title="참여 취소"
        open={cancelModalOpen}
        setOpen={() => setCancelModalOpen(false)}
      >
        <ConfirmModalContent
          message="정말로 공동구매 참여를 취소하시겠어요?"
          onConfirm={handleCancelParticipation}
        />
      </CustomModal>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}
