"use client";

import { useState, useEffect } from "react";
import { Autocomplete, TextField, Box, Typography, CircularProgress } from "@mui/material";
import { University } from "@/types/auth";
// import { searchUniversities } from "@/apis/services/auth";

const STUB_UNIVERSITIES: University[] = [
  { id: "1", name: "서울대학교", domain: "snu.ac.kr", campusType: "본교", region: "서울" },
  { id: "2", name: "연세대학교", domain: "yonsei.ac.kr", campusType: "본교", region: "서울" },
  { id: "3", name: "고려대학교", domain: "korea.ac.kr", campusType: "본교", region: "서울" },
  { id: "4", name: "성균관대학교", domain: "skku.edu", campusType: "본교", region: "서울" },
  { id: "5", name: "한양대학교", domain: "hanyang.ac.kr", campusType: "본교", region: "서울" },
  { id: "6", name: "한양대학교", domain: "hanyang.ac.kr", campusType: "ERICA", region: "경기" },
  { id: "7", name: "경희대학교", domain: "khu.ac.kr", campusType: "본교", region: "서울" },
  { id: "8", name: "경희대학교", domain: "khu.ac.kr", campusType: "국제", region: "경기" },
  { id: "9", name: "부산대학교", domain: "pusan.ac.kr", campusType: "본교", region: "부산" },
  { id: "10", name: "KAIST", domain: "kaist.ac.kr", campusType: "본교", region: "대전" },
];

const searchUniversities = async (keyword: string): Promise<University[]> => {
  await new Promise((r) => setTimeout(r, 100)); // 네트워크 지연 시뮬레이션
  if (!keyword.trim()) return STUB_UNIVERSITIES;
  return STUB_UNIVERSITIES.filter((u) =>
    u.name.includes(keyword) || u.region.includes(keyword)
  );
};

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
        const results = await searchUniversities(inputValue);
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
