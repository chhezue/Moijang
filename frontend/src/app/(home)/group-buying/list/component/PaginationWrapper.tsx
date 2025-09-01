"use client"; // URL 조작을 위해 클라이언트 컴포넌트로 전환

import { Pagination } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface PaginationWrapperProps {
  page: number; // 현재 페이지
  count: number; // 전체 페이지 수
}

export const PaginationWrapper: React.FC<PaginationWrapperProps> = ({
  page,
  count,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // 현재 URL의 searchParams를 읽어옵니다.

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    // 1. 현재 searchParams를 기반으로 새로운 URLSearchParams 객체를 생성합니다.
    //    이렇게 하면 기존의 keyword, status 등의 파라미터가 모두 복사됩니다.
    const currentParams = new URLSearchParams(searchParams);

    // 2. 'page' 파라미터 값만 새로운 페이지 번호로 업데이트합니다.
    currentParams.set("page", String(value));

    // 3. 기존 파라미터가 유지된 채로 완성된 URL로 이동합니다.
    //    결과 예시: /list?keyword=텀블러&page=2
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  return (
    <Pagination
      page={page}
      count={count}
      onChange={handleChange}
      color="primary"
    />
  );
};
