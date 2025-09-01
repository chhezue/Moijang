"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Box, Paper, Stack, Button, Skeleton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useStatusContext } from "@/providers/StatusProvider";
import { useCategoryContext } from "@/providers/CategoryProvider";
import SearchInput from "@/app/(home)/group-buying/list/component/SearchAndFilterBar/SearchInput";
import FilterDropdown from "@/app/(home)/group-buying/list/component/SearchAndFilterBar/FilterDropdown";

export default function SearchAndFilterHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // url의 현재 필터 값으로 로컬 상태 초기화
  const [localFilters, setLocalFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    status: searchParams.get("status") || "",
    category: searchParams.get("category") || "",
  });

  const handleLocalFilterChange = (
    key: keyof typeof localFilters,
    value: string
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  // '검색' 버튼 클릭 시 실행될 함수: 로컬 상태를 URL에 최종 반영
  const handleApplyFilters = () => {
    const currentParams = new URLSearchParams(); // 빈 파라미터에서 시작
    // 로컬 상태의 값이 존재할 때만 파라미터에 추가
    if (localFilters.keyword)
      currentParams.set("keyword", localFilters.keyword);
    if (localFilters.status) currentParams.set("status", localFilters.status);
    if (localFilters.category)
      currentParams.set("category", localFilters.category);

    currentParams.set("page", "1");
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  // Context에서 옵션 목록과 로딩 상태 가져오기
  const { statusList, isLoading: isStatusLoading } = useStatusContext();
  const { categoryList, isLoading: isCategoryLoading } = useCategoryContext();
  const isLoading = isStatusLoading || isCategoryLoading;

  const statusOptions = useMemo(() => {
    const options = statusList.map((item) => ({
      value: item.key,
      label: item.label,
    }));
    return [{ value: "", label: "전체" }, ...options];
  }, [statusList]);

  const categoryOptions = useMemo(() => {
    const options = categoryList.map((item) => ({
      value: item.key,
      label: item.label,
    }));
    return [{ value: "", label: "전체" }, ...options];
  }, [categoryList]);

  return (
    <Box sx={{ width: "1200px", mx: "auto", mb: 3 }}>
      <Paper elevation={0} sx={{ p: 2 }}>
        {isLoading ? (
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="rounded" height={40} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="rounded" height={40} />
            </Box>
            <Box sx={{ flex: 4 }}>
              <Skeleton variant="rounded" height={40} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="rounded" height={40} />
            </Box>
          </Stack>
        ) : (
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flex: 1 }}>
              <FilterDropdown
                label="진행 상태"
                value={localFilters.status}
                onChange={(e: any) =>
                  handleLocalFilterChange("status", e.target.value)
                }
                options={statusOptions}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <FilterDropdown
                label="카테고리"
                value={localFilters.category}
                onChange={(e: any) =>
                  handleLocalFilterChange("category", e.target.value)
                }
                options={categoryOptions}
              />
            </Box>
            <Box sx={{ flex: 4 }}>
              <SearchInput
                initialValue={localFilters.keyword} // 초기값 설정
                onValueChange={(keyword) =>
                  handleLocalFilterChange("keyword", keyword)
                }
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                startIcon={<SearchIcon />}
                fullWidth
                sx={{ height: 40 }}
              >
                검색하기
              </Button>
            </Box>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
