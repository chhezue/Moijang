"use client";

import { useState, useRef, useEffect } from "react";
import { Box, InputBase } from "@mui/material";

export default function SearchInput({
  initialValue = "",
  onValueChange,
}: {
  initialValue?: string;
  onValueChange: (keyword: string) => void;
}) {
  const [keyword, setKeyword] = useState(initialValue); // 사용자가 타이핑하는 값
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKeyword = e.target.value;
    setKeyword(newKeyword);
    onValueChange(newKeyword); // 모든 키 입력마다 부모의 로컬 상태를 업데이트
  };

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
          placeholder="찾으시는 공동구매가 있나요?"
          fullWidth
          value={keyword}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            color: "text.primary",
            "&::placeholder": {
              fontWeight: 400,
              color: "text.secondary",
              opacity: 1,
            },
          }}
        />
      </Box>
    </Box>
  );
}
