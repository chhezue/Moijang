"use client";

import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

interface ProgressBarProps {
  current: number;
  total: number;
  unit?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  unit = "개",
}) => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isComplete = percentage >= 100;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          달성률
        </Typography>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{
            color: isComplete ? "#F59E0B" : "#8B5CF6",
          }}
        >
          {current.toLocaleString()}/{total.toLocaleString()}
          {unit}
        </Typography>
      </Box>

      <Box sx={{ position: "relative", mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 12,
            borderRadius: 6,
            backgroundColor: "grey.200",
            "& .MuiLinearProgress-bar": {
              borderRadius: 6,
              background: isComplete
                ? "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
                : "linear-gradient(90deg, #8B5CF6 0%, #A78BFA 100%)",
              boxShadow: isComplete
                ? "0 2px 8px rgba(245, 158, 11, 0.3)"
                : "0 2px 8px rgba(139, 92, 246, 0.3)",
            },
          }}
        />
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          fontWeight: 600,
          color: isComplete ? "#F59E0B" : "#8B5CF6",
        }}
      >
        {percentage.toFixed(1)}% {isComplete && "🎉 목표 달성!"}
      </Typography>
    </Box>
  );
};

export default ProgressBar;
