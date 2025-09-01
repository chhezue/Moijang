"use client";

import { ViewByList } from "@/app/(home)/group-buying/list/component/ViewByList";
import { PaginationWrapper } from "@/app/(home)/group-buying/list/component/PaginationWrapper";
import { Box } from "@mui/material";
import { GroupBuyingItem, PaginationMeta } from "@/apis/interfaces";

interface MyParticipantClientProps {
  items: GroupBuyingItem[];
  meta: PaginationMeta;
}

export function MyParticipantClient({ items, meta }: MyParticipantClientProps) {
  return (
    <Box
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        px: 3,
        py: 6,
      }}
    >
      <ViewByList items={items} />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 4,
          mb: 2,
        }}
      >
        <PaginationWrapper page={meta.page} count={meta.totalPages} />
      </Box>
    </Box>
  );
}
