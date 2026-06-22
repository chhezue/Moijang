import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  subMessage?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, message, subMessage, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        gap: 1,
        textAlign: "center",
      }}
    >
      {icon && <Box sx={{ mb: 0.5, opacity: 0.4, color: "text.disabled" }}>{icon}</Box>}
      <Typography variant="body2" color="text.disabled" fontWeight={500}>
        {message}
      </Typography>
      {subMessage && (
        <Typography variant="caption" color="text.disabled">
          {subMessage}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  );
}
