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
import { IParticipant } from "@/apis/interfaces";

interface ParticipantListProps {
  participants: IParticipant[];
  leaderId: string;
  status: string;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  leaderId,
  status,
}) => {
  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ fontSize: "1rem" }}
        >
          참여자
        </Typography>
        <Chip
          label={`${participants.length || 0}명`}
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
        {participants.map((p) => {
          // 상태에 따라 Chip의 props를 결정하는 로직
          const getChipProps = () => {
            const isLeader = p.userId.id === leaderId;
            if (isLeader) {
              return { label: "총대", color: "primary" as const };
            }
            if (p.isPaid) {
              return { label: "입금 완료", color: "success" as const };
            }
            return { label: "입금 대기", color: "default" as const };
          };

          return (
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
                <Avatar
                  sx={{
                    bgcolor: "#A78BFA",
                    width: 36,
                    height: 36,
                  }}
                >
                  <AccountCircleIcon fontSize="small" />
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                disableTypography
                primary={
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start" // [수정] flex-start로 정렬 문제 해결
                  >
                    <Box>
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                          sx={{ fontSize: "0.85rem" }}
                        >
                          {p.userId.displayName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          ml={0.75}
                          sx={{ fontSize: "0.75rem" }}
                        >
                          • {p.userId.department}
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
                      {...getChipProps()}
                      sx={{
                        height: "22px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        mt: "1px",
                        borderWidth: "1.5px",
                        "&.MuiChip-outlined": {
                          borderColor: (theme) => {
                            const chipProps = getChipProps();
                            if (chipProps.color === "primary")
                              return theme.palette.primary.main;
                            if (chipProps.color === "success")
                              return theme.palette.success.main;
                            return theme.palette.grey[500];
                          },
                        },
                      }}
                    />
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default ParticipantList;
