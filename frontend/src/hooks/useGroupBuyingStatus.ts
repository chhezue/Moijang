// hooks/useStatusMeta.ts
import { useEffect, useState, useMemo } from "react";
import api from "@/apis/apiClient";

const colorPalette = [
  { bg: "#EBF4FF", color: "#1D66D4" }, // 0. RECRUITING  - 모집 중 (파란색)
  { bg: "#E6F5E6", color: "#3C873E" }, // 1. CONFIRMED   - 모집 완료 (초록색)
  { bg: "#F3E8FD", color: "#6B2FBB" }, // 2. ORDERED     - 주문 진행 중 (보라색)
  { bg: "#E3F9E5", color: "#1E8E3E" }, // 3. SHIPPED     - 배송 완료 (명확한 초록색)
  { bg: "#F1F3F4", color: "#5F6368" }, // 4. CANCELLED   - 공구 취소 (회색)
  { bg: "#F0EAFB", color: "#7A3EFF" }, // 5. COMPLETED   - 공구 완료 (밝은 보라색)
];

export function useGroupBuyingStatus() {
  const [isLoading, setIsLoading] = useState(true);

  const [statusList, setStatusList] = useState<{ key: string; label: string }[]>([]);

  useEffect(() => {
    api.get("/api/group-buying/enums").then((res) => {
      setStatusList(res.data.status);
      setIsLoading(false);
    });
  }, []);

  const statusMap = useMemo(() => {
    const map: Record<string, string> = {};
    statusList.forEach((s) => (map[s.key] = s.label));
    return map;
  }, [statusList]);

  const colorMap = useMemo(() => {
    const map: Record<string, { bg: string; color: string }> = {};
    statusList.forEach((s, i) => {
      map[s.key] = colorPalette[i % colorPalette.length];
    });
    return map;
  }, [statusList]);

  const statusToStepIndex = useMemo(() => {
    const map: Record<string, number> = {};
    statusList.forEach((s, i) => {
      map[s.key] = i;
    });
    return map;
  }, [statusList]);

  return { isLoading, statusMap, colorMap, statusList, statusToStepIndex };
}
