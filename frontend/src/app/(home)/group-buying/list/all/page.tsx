import { ViewByList } from "@/app/(home)/group-buying/list/component/ViewByList";
import { getGroupBuying } from "@/apis/services/groupBuying";
import { PaginationWrapper } from "@/app/(home)/group-buying/list/component/PaginationWrapper";
import PushSubscriber from "@/components/PushSubscriber";

export default async function GroupBuyingPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    keyword?: string;
    category?: string;
    status?: string;
  };
}) {
  const currentPage = Number(searchParams.page || 1);
  const { items, meta } = await getGroupBuying({
    page: currentPage,
    keyword: searchParams.keyword,
    category: searchParams.category,
    status: searchParams.status,
  });
  return (
    <div>
      <ViewByList items={items} />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "2rem",
          marginBottom: "2rem",
        }}
      >
        <PaginationWrapper page={meta.page} count={meta.totalPages} />
      </div>
      <PushSubscriber></PushSubscriber>
    </div>
  );
}
