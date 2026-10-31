"use client";

import React, { useState } from "react";
import { Box, Chip, Divider, Link, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { GroupBuyingItem, IParticipant } from "@/types/groupBuying";
import { useRouter } from "next/navigation";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { useStatusContext } from "@/providers/StatusProvider";
import Stepper from "@/components/Stepper";
import ParticipantList from "@/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/ParticipantList";
import ActionButtons from "@/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/ActionButtons";
import NoticeBoard from "@/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/NoticeBoard";
import CustomModal from "@/components/CustomModal";
import EditGroupBuyingModalContent from "@/app/(root)/(home)/group-buying/detail/[id]/components/modals/EditGroupBuyingModalContent";
import ConfirmModalContent from "@/app/(root)/(home)/group-buying/detail/[id]/components/modals/ConfirmModalContent";
import CancelReasonModalContent from "@/app/(root)/(home)/group-buying/detail/[id]/components/modals/CancelReasonModalContent";
import { ShippedModalContent } from "@/app/(root)/(home)/group-buying/detail/[id]/components/modals/ShippedModalContent";
import { ModalType } from "@/app/(root)/(home)/group-buying/detail/[id]/components/types";
import {
  useCancelGroupBuying,
  useShipGroupBuying,
  useUpdateGroupBuyingInfo,
  useUpdateGroupBuyingStatus,
} from "@/hooks/groupBuyingMutations";

interface LeaderDashboardProps {
  item: GroupBuyingItem;
  participants: IParticipant[];
  isParticipantsLoading?: boolean;
}

export default function LeaderDashboard({
  item,
  participants,
  isParticipantsLoading = false,
}: LeaderDashboardProps) {
  const { showSnackbar } = useSnackbar();
  const { statusList, statusToStepIndex } = useStatusContext();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const isCancelled = item.groupBuyingStatus === "CANCELLED";

  const cancelMutation = useCancelGroupBuying(item.id);
  const statusMutation = useUpdateGroupBuyingStatus(item.id);
  const shipMutation = useShipGroupBuying(item.id);
  const infoMutation = useUpdateGroupBuyingInfo(item.id);

  const handleCancelGroupBuying = async (reason: string) => {
    try {
      const result = await cancelMutation.mutateAsync(reason);
      const refundStatus = result?.refundStatus;
      if (refundStatus === "allSuccess") {
        showSnackbar("공동구매가 취소되고 전체 환불이 완료되었습니다.", "success");
      } else if (refundStatus === "partialSuccess") {
        showSnackbar("공동구매가 취소되었으나 일부 환불에 실패했습니다.", "warning");
      } else {
        showSnackbar("공동구매가 취소되었습니다.", "success");
      }
      setActiveModal(null);
    } catch {
      showSnackbar("공동구매 취소가 실패했습니다.", "error");
    }
  };

  const handleProceedOrder = async () => {
    try {
      await statusMutation.mutateAsync("ORDERED");
      setActiveModal(null);
    } catch (error: any) {
      showSnackbar(error.response?.data?.message || "상태 변경에 실패하였습니다.", "error");
    }
  };

  const handleShipped = async ({
    pickupPlace,
    pickupTime,
  }: {
    pickupPlace: string;
    pickupTime: string;
  }) => {
    let result: { pickupInfoSaved: boolean };
    try {
      result = await shipMutation.mutateAsync({ pickupPlace, pickupTime });
    } catch {
      showSnackbar("배송 상태 변경에 실패했습니다.", "error");
      return;
    }
    if (result.pickupInfoSaved) {
      showSnackbar("배송 완료 처리되었습니다.", "success");
    } else {
      showSnackbar(
        "배송 완료 처리됐으나 픽업 정보 저장에 실패했습니다. 수정 버튼으로 다시 입력해주세요.",
        "warning",
      );
    }
    setActiveModal(null);
  };

  const handleEditShipped = async ({
    pickupPlace,
    pickupTime,
  }: {
    pickupPlace: string;
    pickupTime: string;
  }) => {
    try {
      await infoMutation.mutateAsync({ pickupPlace, pickupTime });
      showSnackbar("수령 정보가 수정되었습니다.", "success");
      setActiveModal(null);
    } catch {
      showSnackbar("수령 정보 수정에 실패했습니다.", "error");
    }
  };

  const handleComplete = async () => {
    try {
      await statusMutation.mutateAsync("COMPLETED");
      showSnackbar("공구가 완료되었습니다.", "success");
      setActiveModal(null);
    } catch {
      showSnackbar("공구 완료 처리 실패", "error");
    }
  };

  return (
    <>
      <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
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
              label="총대"
              color="primary"
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
            />
            {isCancelled && (
              <Chip label="취소됨" color="error" size="small" sx={{ fontWeight: 600 }} />
            )}
          </Stack>
        </Box>

        {/* 진행 단계 */}
        {!isCancelled && (
          <Box sx={{ mb: 3 }}>
            <Stepper steps={statusList} activeStep={statusToStepIndex[item.groupBuyingStatus]} />
          </Box>
        )}

        {/* 메인 2단 레이아웃 */}
        <Box
          sx={{
            display: "flex",
            gap: 4,
            flexDirection: { xs: "column", md: "row" },
            opacity: isCancelled ? 0.6 : 1,
            pointerEvents: isCancelled ? "none" : "auto",
          }}
        >
          {/* 좌: 참여자 목록 */}
          <Box sx={{ flex: "0 0 300px", alignSelf: "flex-start" }}>
            <ParticipantList
              participants={participants}
              leaderInfo={{ name: item.leaderId.name, count: item.leaderCount }}
              isLoading={isParticipantsLoading}
            />
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* 우: 진행사항 관리 */}
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            {/* 공지사항 */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                공지사항
              </Typography>
              <NoticeBoard item={item} />
            </Box>

            <Divider />

            {/* 진행사항 액션 버튼 */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                진행사항 입력
              </Typography>
              <ActionButtons item={item} onOpenModal={(type) => setActiveModal(type)} />
            </Box>

            <Divider />

            {/* 기본 정보 */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                공구 정보
              </Typography>
              <Stack spacing={1}>
                <InfoRow label="모집 수량" value={`${item.currentCount} / ${item.fixedCount}개`} />
                <InfoRow label="예상 가격" value={`${item.estimatedPrice?.toLocaleString()}원`} />
                <InfoRow
                  label="마감일"
                  value={new Date(item.endDate).toLocaleDateString("ko-KR")}
                />
                {item.pickupPlace && <InfoRow label="수령 장소" value={item.pickupPlace} />}
                {item.pickupTime && <InfoRow label="수령 시간" value={item.pickupTime} />}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 모달 */}
      <CustomModal
        title="공동구매 수정"
        open={activeModal === "editGroupBuying"}
        setOpen={() => setActiveModal(null)}
      >
        <EditGroupBuyingModalContent item={item} close={() => setActiveModal(null)} />
      </CustomModal>

      <CustomModal
        title="모집 중 공동구매 취소"
        open={activeModal === "cancelGroupBuying"}
        setOpen={() => setActiveModal(null)}
      >
        <ConfirmModalContent
          message="정말로 공동구매를 취소하시겠어요?"
          onConfirm={() => handleCancelGroupBuying("LEADER_CANCELLED")}
        />
      </CustomModal>

      <CustomModal
        title="공동구매 주문 진행"
        open={activeModal === "order"}
        setOpen={() => setActiveModal(null)}
      >
        <ConfirmModalContent
          message={
            <>
              공동구매 상태가 <strong>주문 진행 중</strong>으로 바뀌어요.
              <br />
              상품이 도착하면, <strong>배송 완료</strong> 버튼을 눌러 수령 장소와 시간을 공지해
              주세요.
            </>
          }
          onConfirm={handleProceedOrder}
          confirmLabel="주문하러 가기"
        />
      </CustomModal>

      <CustomModal
        title="공동구매 취소"
        open={activeModal === "cancelForPayment"}
        setOpen={() => setActiveModal(null)}
      >
        <CancelReasonModalContent onConfirm={(reason) => handleCancelGroupBuying(reason)} />
      </CustomModal>

      <CustomModal
        title="수령 시간 및 장소 공지"
        open={activeModal === "shipped"}
        setOpen={() => setActiveModal(null)}
      >
        <ShippedModalContent onSubmit={handleShipped} />
      </CustomModal>

      <CustomModal
        title="수령 시간 및 장소 수정"
        open={activeModal === "editShipped"}
        setOpen={() => setActiveModal(null)}
      >
        <ShippedModalContent
          initialPlace={item.pickupPlace}
          initialTime={item.pickupTime}
          onSubmit={handleEditShipped}
        />
      </CustomModal>

      <CustomModal
        title="수령 확인 및 공동구매 완료"
        open={activeModal === "completeGroupBuying"}
        setOpen={() => setActiveModal(null)}
      >
        <ConfirmModalContent
          message={
            <>
              수령 확인을 마치셨나요?
              <br />
              이제 공동구매를 <strong>완료</strong>할 수 있어요.
              <br />
              <br />
              총대님, 고생 많으셨습니다! 🙌
            </>
          }
          onConfirm={handleComplete}
          confirmLabel="완료"
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
