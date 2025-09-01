"use client";

import { useState, useRef, useEffect, InputHTMLAttributes } from "react";
import { Box, InputBase } from "@mui/material";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

export default function TextInput({
  value = "",
  onChange,
  placeholder = "",
  type = "text",
  ...rest
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: "1200px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 0.5,
          border: "1px solid",
          borderColor: isFocused ? "primary.main" : "divider",
          borderRadius: "20px",
          bgcolor: "background.paper",
          transition: "border-color 0.2s",
        }}
      >
        <InputBase
          type={type}
          placeholder={placeholder}
          fullWidth
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          inputProps={rest}
          sx={{ fontSize: "14px", fontWeight: "bold" }}
        />
      </Box>
    </Box>
  );
}
