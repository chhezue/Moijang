// "use client";

import {
  ItemOfList,
  ItemOfListProps,
} from "@/app/(home)/group-buying/list/component/ItemOfList";
import Link from "next/link";
import React from "react";
import { GroupBuyingItem } from "@/apis/interfaces";

interface ViewByListProps {
  items: GroupBuyingItem[];
}

export const ViewByList = ({ items }: ViewByListProps) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "16px",
      }}
    >
      {items.map((item, idx) => (
        <Link href={`/group-buying/detail/${item.id}`} key={item.id}>
          <ItemOfList item={item} />
        </Link>
      ))}
    </div>
  );
};
