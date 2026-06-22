"use client";

import React from "react";
import {
  Avatar,
  Box,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { IParticipant } from "@/types/groupBuying";
import LeaderInfoCard from "@/components/LeaderInfoCard";
import EmptyState from "@/components/EmptyState";

interface ParticipantListProps {
  participants: IParticipant[];
  leaderInfo: { name: string; count: number };
}

const ParticipantList: React.FC<ParticipantListProps> = ({ participants, leaderInfo }) => {
  const totalPeople = participants.length + 1; // 일반 참여자 + 총대
  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: "1rem" }}>
          참여자
        </Typography>
        <Chip
          label={`${totalPeople}명`}
          size="small"
          sx={{
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            fontWeight: 600,
            fontSize: "0.75rem",
            height: "22px",
          }}
        />
      </Box>

      <List dense sx={{ p: 0 }}>
        {/* 총대 (항상 첫 번째) */}
        <Box mb={1}>
          <LeaderInfoCard name={leaderInfo.name} count={leaderInfo.count} />
        </Box>

        {/* 일반 참여자 */}
        {participants.length === 0 && <EmptyState message="아직 참여자가 없습니다" />}
        {participants.map((p) => (
          <ListItem
            key={p.id}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "12px",
              mb: 1,
              p: 1.5,
              backgroundColor: "background.paper",
            }}
          >
            <ListItemAvatar sx={{ minWidth: "auto", mr: 1.5 }}>
              <Avatar sx={{ bgcolor: "#A78BFA", width: 36, height: 36 }}>
                <AccountCircleIcon fontSize="small" />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              disableTypography
              primary={
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                        sx={{ fontSize: "0.85rem" }}
                      >
                        {p.userId.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                      sx={{ fontSize: "0.75rem", opacity: 0.8 }}
                    >
                      구매 수량: {p.count}개
                    </Typography>
                  </Box>
                  <Chip
                    variant="outlined"
                    size="small"
                    label="참여 중"
                    color="default"
                    sx={{
                      height: "22px",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      mt: "1px",
                      borderWidth: "1.5px",
                    }}
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ParticipantList;
