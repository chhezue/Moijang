import React from "react";
import { Chip, alpha } from "@mui/material";

interface CategoryTagProps {
  IconComponent?: React.ComponentType;
  label: string;
}

const CategoryTag: React.FC<CategoryTagProps> = ({ IconComponent, label }) => {
  return (
    <Chip
      icon={IconComponent ? <IconComponent /> : undefined}
      label={label}
      variant="filled"
      size="small"
      sx={{
        height: "28px",
        fontSize: "0.75rem",
        borderRadius: "6px",
        fontWeight: 500,
        border: "none",
        backgroundColor: (theme) => alpha(theme.palette.primary.light, 0.1),
        color: (theme) => theme.palette.primary.main,
        "& .MuiChip-icon": {
          marginLeft: "8px", // 아이콘 왼쪽 여백 증가
          marginRight: "0px", // 아이콘-라벨 간격 감소
          fontSize: "20px", // 아이콘 크기 증가
          color: (theme) => alpha(theme.palette.primary.main, 0.8),
        },
        "& .MuiChip-label": {
          paddingLeft: "8px", // 라벨 왼쪽 여백 증가
          paddingRight: "12px", // 라벨 오른쪽 여백 증가
        },
      }}
    />
  );
};

export default CategoryTag;
