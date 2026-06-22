"use client";

import { Suspense } from "react";
import { Pagination } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React from "react";

interface PaginationWrapperProps {
  page: number;
  count: number;
}

function PaginationContent({ page, count }: PaginationWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<unknown>, value: number) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("page", String(value));
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  return <Pagination page={page} count={count} onChange={handleChange} color="primary" />;
}

export const PaginationWrapper: React.FC<PaginationWrapperProps> = ({ page, count }) => {
  return (
    <Suspense>
      <PaginationContent page={page} count={count} />
    </Suspense>
  );
};
