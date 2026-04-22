"use client";

import { useState, useEffect } from "react";
import { Autocomplete, TextField, Box, Typography, CircularProgress } from "@mui/material";
import { University } from "@/types/auth";
import { searchUniversity } from "@/apis/services/auth";


interface Props {
  university: University | null;
  onUniversityChange: (u: University | null) => void;
}

export default function Step1University({ university, onUniversityChange }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchUniversity(inputValue);
        setOptions(results);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  return (
    <Autocomplete
      options={options} // 항목 목록
      getOptionLabel={(option) => option.name}
      filterOptions={(x) => x}
      value={university} // 현재 선택된 값
      inputValue={inputValue} // 텍스트 값
      onInputChange={(_, value) => setInputValue(value)}
      onChange={(_, newValue) => onUniversityChange(newValue)} // option의 배열 하나 -> newValue
      loading={loading}
      // noOptionsText="검색 결과가 없습니다."
      isOptionEqualToValue={(option, value) => option.id === value.id}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box>
            <Typography variant="body2">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.region} · {option.campusType}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="대학교"
          placeholder="대학교 이름을 검색하세요"
          // helperText={university ? `이메일 도메인: @${university.domain}` : " "}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={16} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
