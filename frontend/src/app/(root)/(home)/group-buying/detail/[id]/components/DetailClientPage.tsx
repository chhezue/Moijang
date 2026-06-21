"use client"; // MUI 컴포넌트를 사용하므로 클라이언트 컴포넌트입니다.

import React, { useEffect, useState } from "react";
import { Box, Container } from "@mui/material";
import { GroupBuyingItem, IParticipant } from "@/types/groupBuying";

import DetailInfoSection from "./DetailInfoSection";
import Stepper from "@/components/Stepper";
import Sidebar from "@/app/(root)/(home)/group-buying/detail/[id]/components/sidebar/Sidebar";
import { useStatusContext } from "@/providers/StatusProvider";
import CustomModal from "@/components/CustomModal";
import ParticipationModalContent from "@/app/(root)/(home)/group-buying/detail/[id]/components/modals/ParticipationModalContent";
import { useRouter, useSearchParams } from "next/navigation";
import { useSnackbar } from "@/providers/SnackbarProvider";
import { ModalType } from "./types";
import { useAuthStore } from "@/store/authStore";
import CancelledBanner from "@/app/(root)/(home)/group-buying/detail/[id]/components/CancelledBanner";

interface ClientPageProps {
  item: GroupBuyingItem;
  participants: IParticipant[];
}

const DetailClientPage: React.FC<ClientPageProps> = ({ item, participants }) => {
  const { showSnackbar } = useSnackbar();
  const { statusList, statusToStepIndex } = useStatusContext();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    if (searchParams.get("joined") === "true") {
      showSnackbar("공동구매 참여가 완료되었습니다.", "success");
      router.replace(`/group-buying/detail/${item.id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCancelled = item.groupBuyingStatus === "CANCELLED";

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
          {!isCancelled && (
            <Box sx={{ mb: 4 }}>
              <Stepper steps={statusList} activeStep={statusToStepIndex[item.groupBuyingStatus]} />
            </Box>
          )}

          {isCancelled && <CancelledBanner item={item} />}

          {/* 2. 메인 콘텐츠 영역 */}
          <Box
            sx={{
              backgroundColor: "#fff",
              borderRadius: "1rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              overflow: "hidden",
              filter: isCancelled ? "grayscale(1)" : "none",
              opacity: isCancelled ? 0.75 : 1,
              cursor: isCancelled ? "not-allowed" : "default",
              pointerEvents: isCancelled ? "none" : "auto",
              transition: "filter 0.3s ease, opacity 0.3s ease",
              position: "relative",
            }}
          >
            {/* 취소된 공구일 때 오버레이 */}
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
            <Box display="flex" flexDirection={{ xs: "column", lg: "row" }} gap={0}>
              {/* 왼쪽 메인 콘텐츠 (2/3 너비) */}
              <Box
                sx={{
                  width: { xs: "100%", lg: "66.67%" },
                  borderRight: { lg: "1px solid #f0f0f0" },
                }}
              >
                <DetailInfoSection item={item} />
              </Box>

              {/* 오른쪽 사이드바 (1/3 너비) */}
              <Box sx={{ width: { xs: "100%", lg: "33.33%" } }}>
                <Box sx={{ position: "sticky", top: "2rem", p: "2rem" }}>
                  <Sidebar
                    item={item}
                    user={user}
                    participants={participants}
                    onOpenModal={(type) => {
                      setActiveModal(type);
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ---- 모달창 ----- */}
      {/* 참여 */}
      <CustomModal
        title="공동구매 참여"
        open={activeModal === "participation"}
        setOpen={() => setActiveModal(null)}
      >
        <ParticipationModalContent
          gbId={item.id}
          close={() => setActiveModal(null)}
          remainingCount={item.fixedCount - item.currentCount}
        />
      </CustomModal>
    </>
  );
};

export default DetailClientPage;
