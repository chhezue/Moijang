import React from "react";
import { Box, Typography } from "@mui/material";

interface StatusTagProps {
  status: string;
  label: string;
  color: { bg: string; color: string };
}

const StatusTag = ({ label, color }: StatusTagProps) => {
  return (
    <Box
      sx={{
        display: "inline-block",
        px: 1.5,
        py: 0.5,
        fontSize: "0.875rem",
        borderRadius: "999px",
        backgroundColor: color.bg,
        color: color.color,
        fontWeight: 500,
      }}
    >
      {label}
    </Box>
  );
};

export default StatusTag;
