"use client";

import React from "react";
import { GroupBuyingItem, IParticipant } from "@/types/groupBuying";
import { UserDto } from "@/types/auth";
import { Stack, Divider, Typography, Box, Button } from "@mui/material";
import ProgressBar from "./ProgressBar";
import ParticipantList from "./ParticipantList";
import { ModalType } from "../types";
import { useRouter } from "next/navigation";
import DashboardIcon from "@mui/icons-material/Dashboard";

interface SidebarProps {
  participants: IParticipant[];
  item: GroupBuyingItem;
  user: UserDto | null;
  onOpenModal: (type: ModalType, action?: "join" | "modify") => void;
}

const Sidebar: React.FC<SidebarProps> = ({ participants, item, onOpenModal, user }) => {
  const router = useRouter();
  const { isOwner, isParticipant, groupBuyingStatus } = item;

  const dashboardPath = isOwner
    ? `/dashboard/leading/${item.id}`
    : `/dashboard/participating/${item.id}`;

  return (
    <Stack spacing={3}>
      {/* 달성률 */}
      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          참여 현황
        </Typography>
        <Box mt={2}>
          <ProgressBar current={item.currentCount} total={item.fixedCount} unit="개" />
        </Box>
      </Box>

      {/* 액션 영역 */}
      {!user ? (
        <Box>
          <Typography color="text.secondary">로그인 후 공구에 참여해 보세요!</Typography>
        </Box>
      ) : isOwner || isParticipant ? (
        <Button
          variant="outlined"
          fullWidth
          startIcon={<DashboardIcon />}
          onClick={() => router.push(dashboardPath)}
        >
          {isOwner ? "대시보드에서 관리하기" : "진행사항 확인하기"}
        </Button>
      ) : (
        groupBuyingStatus === "RECRUITING" && (
          <Button
            variant="contained"
            fullWidth
            onClick={() => onOpenModal("participation", "join")}
          >
            공동구매 참여하기
          </Button>
        )
      )}

      <Divider />

      {/* 참여자 리스트 */}
      <ParticipantList
        participants={participants}
        leaderInfo={{ name: item.leaderId.name, count: item.leaderCount }}
      />
    </Stack>
  );
};

export default Sidebar;
