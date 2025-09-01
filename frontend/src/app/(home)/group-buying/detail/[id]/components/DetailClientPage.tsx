"use client"; // MUI 컴포넌트를 사용하므로 클라이언트 컴포넌트입니다.

import React, { useEffect, useState } from "react";
import { Box, Container, Skeleton } from "@mui/material";
import { GroupBuyingItem, IParticipant } from "@/apis/interfaces";

import DetailInfoSection from "./DetailInfoSection";
import Stepper from "@/components/Stepper";
import Sidebar from "@/app/(home)/group-buying/detail/[id]/components/sidebar/Sidebar";
import { useStatusContext } from "@/providers/StatusProvider";
import CustomModal from "@/components/CustomModal";
import ParticipationModalContent from "@/app/(home)/group-buying/detail/[id]/components/modals/ParticipationModalContent";
import EditGroupBuyingModalContent from "@/app/(home)/group-buying/detail/[id]/components/modals/EditGroupBuyingModalContent";
import {
  cancelParticipant,
  confirmPayment,
  getParticipantList,
} from "@/apis/services/participant";
import { useRouter } from "next/navigation";
import ConfirmModalContent from "@/app/(home)/group-buying/detail/[id]/components/modals/ConfirmModalContent";
import { useSnackbar } from "@/providers/SnackbarProvider";
import {
  cancelGroupBuying,
  updateGroupBuying,
  updateGroupBuyingStatus,
} from "@/apis/services/groupBuying";
import { ModalType } from "./types";
import RequestPaymentModalContent from "@/app/(home)/group-buying/detail/[id]/components/modals/RequestPaymentModalContent";
import EditPriceModalContent from "@/app/(home)/group-buying/detail/[id]/components/modals/EditPriceModalContent";
import CancelReasonModalContent from "@/app/(home)/group-buying/detail/[id]/components/modals/CancelReasonModalContent";
import { ShippedModalContent } from "@/app/(home)/group-buying/detail/[id]/components/modals/ShippedModalContent";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import CancelledBanner from "@/app/(home)/group-buying/detail/[id]/components/CancelledBanner";
import { theme } from "@/styles/theme";

interface ClientPageProps {
  item: GroupBuyingItem;
  participants: IParticipant[];
}

const DetailClientPage: React.FC<ClientPageProps> = ({
  item,
  participants,
}) => {
  const { showSnackbar } = useSnackbar();
  const { statusList, statusToStepIndex } = useStatusContext();
  const [loading, setLoading] = useState(true);
  const user = useSelector((state: RootState) => state.common.user);
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [participationAction, setParticipationAction] = useState<
    "join" | "modify"
  >("join");

  // useEffect(() => {
  //   getParticipantList(item.id)
  //     .then((res) => setParticipants(res.items))
  //     .finally(() => setLoading(false));
  // }, [item.id]);

  // 단순 함수는 이곳에서 정의, 폼 기반 함수는 각각의 컴포넌트에서 정의함
  // 참여 취소
  const handleCancelParticipation = async () => {
    try {
      await cancelParticipant(item.id);
      showSnackbar("참여가 취소되었습니다.", "success");
      router.refresh();
      setActiveModal(null);
    } catch (err) {
      console.error("참여 취소 실패:", err);
      showSnackbar("공동구매 참여 취소에 실패했습니다.", "error");
    }
  };

  // 공동구매 취소
  const handleCancelGroupBuying = async (
    reason: string,
    nonDepositors?: string[]
  ) => {
    try {
      await cancelGroupBuying(item.id, reason, nonDepositors);
      showSnackbar("공동구매가 취소되었습니다.", "success");
      router.refresh();
      setActiveModal(null);
    } catch (err) {
      console.error("공동구매 취소 실패:", err);
      showSnackbar("공동구매 취소가 실패했습니다.", "error");
    }
  };

  //송금 요청 보내기
  const handleRequestPayment = async () => {
    try {
      await updateGroupBuyingStatus(item.id, "PAYMENT_IN_PROGRESS");
      showSnackbar("송금 요청을 보냈습니다.", "success");
      setActiveModal(null);
      router.refresh(); // 새로고침
    } catch (error: any) {
      console.error(error);
      showSnackbar(
        error.response?.data?.message || "송금 요청이 실패했습니다.",
        "error"
      );
    }
  };

  // 입금 완료 보내기
  const handleConfirmPayment = async () => {
    try {
      await confirmPayment(item.id);
      showSnackbar("입금 완료가 확인되었습니다.", "success");
      setActiveModal(null);
      router.refresh();
    } catch (err) {
      console.error("confirmPayment error:", err);
      showSnackbar("입금 완료 처리에 실패했습니다.", "error");
    }
  };

  // 주문 진행 상태 업데이트
  const handleProceedOrder = async () => {
    try {
      await updateGroupBuyingStatus(item.id, "ORDERED");
      window.open(item.productUrl, "_blank");
      router.refresh();
      setActiveModal(null);
    } catch (error: any) {
      console.error("주문 진행 중 오류 발생:", error);
      showSnackbar(
        error.response?.data?.message || "상태 변경에 실패하였습니다.",
        "error"
      );
    }
  };

  // 주문 완료, 수령 공지
  const handleShipped = async ({
    pickupPlace,
    pickupTime,
  }: {
    pickupPlace: string;
    pickupTime: string;
  }) => {
    try {
      await updateGroupBuyingStatus(item.id, "SHIPPED");
      await updateGroupBuying(item.id, { pickupPlace, pickupTime });
      showSnackbar("배송 완료 처리되었습니다.", "success");
      setActiveModal(null);
      router.refresh();
    } catch (err) {
      console.error("shippedModal error:", err);
      showSnackbar("배송 정보 저장에 실패했습니다.", "error");
    }
  };

  // 수령 장소/시간 수정
  const handleEditShipped = async ({
    pickupPlace,
    pickupTime,
  }: {
    pickupPlace: string;
    pickupTime: string;
  }) => {
    try {
      await updateGroupBuying(item.id, { pickupPlace, pickupTime });
      showSnackbar("수령 정보가 수정되었습니다.", "success");
      setActiveModal(null);
      router.refresh();
    } catch (err) {
      console.error("editPickupModal error:", err);
      showSnackbar("수령 정보 수정에 실패했습니다.", "error");
    }
  };

  // 취소된 공구인지 확인
  const isCancelled = item.groupBuyingStatus === "CANCELLED";

  const handleComplete = async () => {
    try {
      await updateGroupBuyingStatus(item.id, "COMPLETED");
      showSnackbar("공구가 완료되었습니다.", "success");
      setActiveModal(null);
      router.refresh();
    } catch (e) {
      showSnackbar("공구 완료 처리 실패", "error");
      console.error(e);
    }
  };

  return (
    // 페이지 전체를 감싸는 배경 Box
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "var(--bg-0)",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* 1. 최상단 Stepper (취소된 공구일 때는 숨김) */}
          {!isCancelled && (
            <Box sx={{ mb: 4 }}>
              <Stepper
                steps={statusList}
                activeStep={statusToStepIndex[item.groupBuyingStatus]}
              />
            </Box>
          )}

          {isCancelled && <CancelledBanner item={item} />}

          {/* 2. 메인 콘텐츠 영역 - 공통 컨테이너로 감싸기 */}
          <Box
            sx={{
              backgroundColor: "#fff",
              borderRadius: "1rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              overflow: "hidden", // 자식 요소들이 borderRadius를 넘지 않도록
              // 취소된 공구일 때만 흑백 필터 및 포인터 비활성화 적용
              filter: isCancelled ? "grayscale(1)" : "none",
              opacity: isCancelled ? 0.75 : 1,
              cursor: isCancelled ? "not-allowed" : "default",
              pointerEvents: isCancelled ? "none" : "auto",
              transition: "filter 0.3s ease, opacity 0.3s ease",
              position: "relative",
            }}
          >
            {/* 취소된 공구일 때 오버레이 추가 (detail page 영역에만) */}
            {isCancelled && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.05)",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
            )}
            {/* Flexbox 레이아웃 */}
            <Box
              display="flex"
              flexDirection={{ xs: "column", lg: "row" }}
              gap={0} // 공통 컨테이너 안에서는 gap 제거
            >
              {/* 왼쪽 메인 콘텐츠 (2/3 너비) */}
              <Box
                sx={{
                  width: { xs: "100%", lg: "66.67%" },
                  borderRight: { lg: "1px solid #f0f0f0" }, // 구분선 추가
                }}
              >
                <DetailInfoSection item={item} />
              </Box>

              {/* 오른쪽 사이드바 (1/3 너비) */}
              <Box sx={{ width: { xs: "100%", lg: "33.33%" } }}>
                <Box sx={{ position: "sticky", top: "2rem", p: "2rem" }}>
                  {/*{loading ? (*/}
                  {/*  <>*/}
                  {/*    <Skeleton variant="text" width={120} height={28} />*/}
                  {/*    <Skeleton*/}
                  {/*      variant="rounded"*/}
                  {/*      width="100%"*/}
                  {/*      height={50}*/}
                  {/*      sx={{ mt: 1 }}*/}
                  {/*    />*/}
                  {/*    <Skeleton*/}
                  {/*      variant="rounded"*/}
                  {/*      width="100%"*/}
                  {/*      height={50}*/}
                  {/*      sx={{ mt: 1 }}*/}
                  {/*    />*/}
                  {/*  </>*/}
                  {/*) : (*/}
                  <Sidebar
                    item={item}
                    user={user}
                    participants={participants}
                    onOpenModal={(type, action) => {
                      setActiveModal(type);
                      if (action) setParticipationAction(action);
                    }}
                  />
                  {/*)}*/}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      {/* ---- 모달창 ----- */}
      {/* 참여/수정 */}
      <CustomModal
        title={
          participationAction === "join"
            ? "공동구매 참여"
            : "수량 및 계좌 정보 수정"
        }
        open={activeModal === "participation"}
        setOpen={() => setActiveModal(null)}
      >
        <ParticipationModalContent
          gbId={item.id}
          close={() => setActiveModal(null)}
          action={participationAction}
          remainingCount={item.fixedCount - item.currentCount}
          isLeader={item.isOwner}
        />
      </CustomModal>

      {/* 참여 취소 */}
      <CustomModal
        title="참여 취소"
        open={activeModal === "cancelParticipation"}
        setOpen={() => setActiveModal(null)}
      >
        <ConfirmModalContent
          message="정말로 공동구매 참여를 취소하시겠어요?"
          onConfirm={handleCancelParticipation}
        />
      </CustomModal>

      {/* 공동구매 수정 */}
      <CustomModal
        title="공동구매 수정"
        open={activeModal === "editGroupBuying"}
        setOpen={() => setActiveModal(null)}
      >
        <EditGroupBuyingModalContent
          item={item}
          close={() => setActiveModal(null)}
        />
      </CustomModal>

      {/* 모집 중 공동구매 취소 */}
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

      {/* 결제 요청 모달 */}
      <CustomModal
        title="결제 요청 보내기"
        open={activeModal === "requestPayment"}
        setOpen={() => setActiveModal(null)}
      >
        <RequestPaymentModalContent
          item={item} // 단가 보여줄 거면 props로 넘김
          participants={participants} // 참여자 목록/금액
          onConfirm={handleRequestPayment} // 송금 요청 API 호출
          onOpenModal={setActiveModal}
        />
      </CustomModal>

      {/* 가격만 수정 */}
      <CustomModal
        title="가격 수정"
        open={activeModal === "editPrice"}
        setOpen={() => setActiveModal("requestPayment")}
      >
        <EditPriceModalContent
          item={item}
          onSuccess={() => {
            router.refresh();
            setActiveModal("requestPayment");
          }}
        />
      </CustomModal>

      {/* 입금 완료 확인 */}
      <CustomModal
        title="입금 완료 확인"
        open={activeModal === "confirmPayment"}
        setOpen={() => setActiveModal(null)}
      >
        <ConfirmModalContent
          message={
            <>
              <strong style={{ color: theme.palette.error.main }}>
                ⛔ 잠깐! 정말 입금 완료하셨나요? ⛔
              </strong>{" "}
              <br />
              총대님이 최종 확인했을 때 입금이 되지 않은 경우, 미입금자로
              처리되며 공동구매가 전체 취소되니{" "}
              <strong>꼭 입금 후 완료 버튼을 눌러주세요.</strong>
              <br />
              <br />
              <strong style={{ color: theme.palette.warning.main }}>
                ⚠️ 환불 안내 ⚠️
              </strong>
              <br />
              미입금으로 인한 취소 시, 총대님이 개별 환불을 진행할 예정이에요.
              <br />
              자세한 사항은 총대님께 직접 문의해주세요.
            </>
          }
          onConfirm={handleConfirmPayment} // 새로 구현할 함수
        />
      </CustomModal>

      {/* 주문하기 */}
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
              상품이 도착하면, <strong>배송 완료</strong> 버튼을 눌러 수령
              장소와 시간을 공지해 주세요.
            </>
          }
          onConfirm={handleProceedOrder}
          confirmLabel="주문하러 가기"
        />
      </CustomModal>

      {/* 입금 진행 중 공동구매 취소 */}
      <CustomModal
        title="주문 전 공동구매 취소"
        open={activeModal === "cancelForPayment"}
        setOpen={() => setActiveModal(null)}
      >
        <CancelReasonModalContent
          participants={participants}
          onConfirm={(reason, nonDepositors) =>
            handleCancelGroupBuying(reason, nonDepositors)
          }
        />
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

      {/* 공동구매 완료(종료) */}
      <CustomModal
        title="수령 확인 및 공동구매 완료"
        open={activeModal === "completeGroupBuying"}
        setOpen={() => setActiveModal(null)}
      >
        <ConfirmModalContent
          message={
            <>
              수령 확인을 마치셨나요? <br />
              이제 공동구매를 <strong>완료</strong>할 수 있어요.
              <br />
              <br />
              총대님, 고생 많으셨습니다! 🙌
            </>
          }
          onConfirm={() => handleComplete()}
          confirmLabel={"완료"}
        />
      </CustomModal>
    </>
  );
};

export default DetailClientPage;
