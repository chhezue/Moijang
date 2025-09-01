"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Popper,
  Fade,
  Paper,
  ClickAwayListener,
  MenuItem,
  MenuList,
  Divider,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

interface UserMenuProps {
  displayName: string;
}

const MENU_ITEMS = [
  {
    label: "참여 중인 공동구매",
    path: "/my/participating",
    icon: <PersonOutlineIcon sx={{ fontSize: "1rem" }} />,
  },
  {
    label: "내가 만든 공동구매",
    path: "/my/created",
    icon: <FolderOpenIcon sx={{ fontSize: "1rem" }} />,
  },
] as const;

const UserMenu: React.FC<UserMenuProps> = ({ displayName }) => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [open, setOpen] = useState(false);

  const handleToggle = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    setOpen((prev) => !prev);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMenuItemClick = (path: string) => {
    router.push(path);
    handleClose();
  };

  const isCurrentPath = (path: string) => pathname === path;

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box sx={{ position: "relative" }}>
        {/* 메인 버튼 */}
        <Box
          onClick={handleToggle}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            cursor: "pointer",
            transition: "all 150ms ease-out",

            "&:hover": {
              backgroundColor: "rgba(139, 92, 246, 0.06)",
              boxShadow: "0 2px 8px rgba(139, 92, 246, 0.12)",

              "& .user-name": {
                color: theme.palette.primary.main,
              },
              "& .expand-icon": {
                color: theme.palette.primary.main,
              },
            },
          }}
        >
          <AccountCircleIcon
            sx={{
              fontSize: "28px",
              color: theme.palette.text.secondary,
            }}
          />

          <Typography
            className="user-name"
            variant="body2"
            sx={{
              fontWeight: 500,
              fontSize: "0.875rem",
              color: theme.palette.text.primary,
              transition: "color 150ms ease-out",
              lineHeight: 1,
            }}
          >
            {displayName}
          </Typography>

          <ExpandMoreIcon
            className="expand-icon"
            sx={{
              fontSize: "1rem",
              color: theme.palette.text.secondary,
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "all 150ms ease-out",
              ml: 0.5,
            }}
          />
        </Box>

        {/* 드롭다운 메뉴 */}
        <Popper
          open={open}
          anchorEl={anchorEl}
          placement="bottom-end"
          transition
          sx={{ zIndex: 1300 }}
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                elevation={0}
                sx={{
                  mt: 0.5,
                  minWidth: 220,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                }}
              >
                {/* 메뉴 아이템들 */}
                <MenuList sx={{ py: 0.5 }}>
                  {MENU_ITEMS.map((item) => {
                    const isActive = isCurrentPath(item.path);

                    return (
                      <MenuItem
                        key={item.path}
                        onClick={() => handleMenuItemClick(item.path)}
                        sx={{
                          py: 1,
                          px: 2,
                          mx: 0.5,
                          my: 0.25,
                          borderRadius: 1.5,
                          transition: "all 120ms ease-out",

                          ...(isActive && {
                            backgroundColor: "rgba(139, 92, 246, 0.08)",
                            color: theme.palette.primary.main,

                            "& .menu-icon": {
                              color: theme.palette.primary.main,
                            },
                          }),

                          "&:hover": {
                            backgroundColor: isActive
                              ? "rgba(139, 92, 246, 0.12)"
                              : "rgba(139, 92, 246, 0.04)",
                            color: theme.palette.primary.main,

                            "& .menu-icon": {
                              color: theme.palette.primary.main,
                            },
                          },
                        }}
                      >
                        <Box
                          className="menu-icon"
                          sx={{
                            mr: 1.5,
                            color: isActive
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                            transition: "color 120ms ease-out",
                          }}
                        >
                          {item.icon}
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isActive ? 500 : 400,
                            fontSize: "0.875rem",
                          }}
                        >
                          {item.label}
                        </Typography>
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default UserMenu;
