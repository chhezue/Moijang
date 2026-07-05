"use client";

import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function ExternalLink({ href, children }: ExternalLinkProps) {
  const [open, setOpen] = useState(false);

  const isSafe = href.startsWith("https://") || href.startsWith("http://");

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSafe) return;
    setOpen(true);
  };

  const handleConfirm = () => {
    setOpen(false);
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Link
        href={href}
        onClick={handleClick}
        underline="hover"
        color="primary"
        fontWeight={500}
        sx={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 0.5 }}
      >
        {children}
        <OpenInNewIcon sx={{ fontSize: "0.9rem" }} />
      </Link>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          외부 사이트로 이동합니다
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            아래 링크로 이동합니다. 신뢰할 수 있는 사이트인지 확인하세요.
          </Typography>
          <Box
            sx={{
              p: 1.5,
              bgcolor: "grey.100",
              borderRadius: 1,
              wordBreak: "break-all",
              fontSize: "0.8rem",
              color: "text.secondary",
            }}
          >
            {href}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} variant="outlined" size="small">
            취소
          </Button>
          <Button onClick={handleConfirm} variant="contained" size="small">
            이동하기
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
