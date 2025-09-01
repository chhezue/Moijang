"use client";

import React from "react";
import { GroupBuyingItem, IParticipant, IUser } from "@/apis/interfaces";
import { Stack, Divider, Typography, Box } from "@mui/material";
import ProgressBar from "./ProgressBar";
import ActionButtons from "./ActionButtons";
import ParticipantList from "./ParticipantList";
import { ModalType } from "../types";
import NoticeBoard from "@/app/(home)/group-buying/detail/[id]/components/sidebar/NoticeBoard";

interface SidebarProps {
  participants: IParticipant[];
  item: GroupBuyingItem;
  user: IUser | null;
  onOpenModal: (type: ModalType, action?: "join" | "modify") => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  participants,
  item,
  onOpenModal,
  user,
}) => {
  return (
    <Stack spacing={3}>
      {/* 달성률 섹션 (간단하니까 Sidebar 안에 둠) */}
      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          참여 현황
        </Typography>
        <Box mt={2}>
          <ProgressBar
            current={item.currentCount}
            total={item.fixedCount}
            unit="개"
          />
        </Box>
      </Box>

      {/*<Divider sx={{ my: 2 }} />*/}

      {/* 공지창 + 버튼 섹션 */}
      {!user ? (
        <Box>
          <Typography color="text.secondary">
            로그인 후 공구에 참여해 보세요!
          </Typography>
        </Box>
      ) : (
        <>
          <NoticeBoard item={item} />
          <ActionButtons item={item} onOpenModal={onOpenModal} />
        </>
      )}

      <Divider sx={{ my: 2 }} />

      {/* 참여자 리스트 */}
      <ParticipantList
        participants={participants}
        leaderId={item.leaderId.id}
        status={item.groupBuyingStatus}
      />
    </Stack>
  );
};

export default Sidebar;
