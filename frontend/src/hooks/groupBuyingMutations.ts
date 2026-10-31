import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelGroupBuying,
  updateGroupBuying,
  updateGroupBuyingStatus,
} from "@/apis/services/groupBuying";

export const groupBuyingKeys = {
  detail: (gbId: string) => ["group-buying", gbId] as const,
  participants: (gbId: string) => ["participants", gbId] as const,
};

function useInvalidateGroupBuyingDetail(gbId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: groupBuyingKeys.detail(gbId) });
}

export function useUpdateGroupBuyingStatus(gbId: string) {
  const invalidate = useInvalidateGroupBuyingDetail(gbId);
  return useMutation({
    mutationFn: (status: string) => updateGroupBuyingStatus(gbId, status),
    onSuccess: () => invalidate(),
  });
}

export function useCancelGroupBuying(gbId: string) {
  const invalidate = useInvalidateGroupBuyingDetail(gbId);
  return useMutation({
    mutationFn: (reason: string) => cancelGroupBuying(gbId, reason),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateGroupBuyingInfo(gbId: string) {
  const invalidate = useInvalidateGroupBuyingDetail(gbId);
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateGroupBuying(gbId, payload),
    onSuccess: () => invalidate(),
  });
}

export function useShipGroupBuying(gbId: string) {
  const invalidate = useInvalidateGroupBuyingDetail(gbId);
  return useMutation({
    mutationFn: async ({
      pickupPlace,
      pickupTime,
    }: {
      pickupPlace: string;
      pickupTime: string;
    }) => {
      await updateGroupBuyingStatus(gbId, "SHIPPED");
      try {
        await updateGroupBuying(gbId, { pickupPlace, pickupTime });
        return { pickupInfoSaved: true };
      } catch {
        return { pickupInfoSaved: false };
      }
    },
    onSuccess: () => invalidate(),
  });
}
