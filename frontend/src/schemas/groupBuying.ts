import { z } from "zod";

const today = new Date();
today.setHours(0, 0, 0, 0);

// Zod 4: refine이 붙은 스키마에는 .omit()을 쓸 수 없으므로, object 단계를 분리합니다.
const createGroupBuyingFieldsSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요.").max(20, "제목은 20자 이하로 입력해주세요."),
  productUrl: z.string().url("유효한 URL을 입력해주세요."),
  description: z
    .string()
    .min(1, "설명을 적어주세요.")
    .max(200, "설명은 200자 이하로 입력해주세요."),
  fixedCount: z.coerce.number().int().min(1, "수량을 확인해주세요."),
  totalPrice: z.coerce.number().int().min(1, "가격을 입력해주세요."),
  shippingFee: z.coerce.number().int().min(0, "0 이상 입력해주세요."),
  account: z
    .string()
    .min(8, "계좌번호가 너무 짧습니다.")
    .transform((v) => v.replace(/[-\s]/g, "")),
  bank: z.string().min(1, "은행을 선택하세요"),
  endDate: z
    .string()
    .min(1, "마감일을 선택하세요.")
    .refine(
      (value) => {
        const inputDate = new Date(value);
        inputDate.setHours(23, 59, 59, 999);
        return inputDate >= today;
      },
      {
        message: "마감일은 오늘 또는 이후여야 합니다.",
      },
    )
    .transform((value) => {
      return `${value}`;
    }),
  category: z.string().min(1, "카테고리를 선택하세요."),
  leaderCount: z.coerce.number().int().min(1, "최소 1개 이상 입력해야 합니다"),
});

// 생성용 스키마
export const createGroupBuyingSchema = createGroupBuyingFieldsSchema.refine(
  (data) => data.leaderCount < data.fixedCount,
  {
    message: "목표 수량 미만까지만 가능합니다",
    path: ["leaderCount"],
  },
);

export type CreateGroupBuyingInput = z.input<typeof createGroupBuyingSchema>;
export type CreateGroupBuyingOutput = z.output<typeof createGroupBuyingSchema>;

export const STEP_FIELDS: Record<number, (keyof CreateGroupBuyingInput)[]> = {
  0: ["title", "productUrl", "category", "description", "totalPrice", "fixedCount", "shippingFee"],
  1: ["endDate", "leaderCount"],
  2: ["bank", "account"],
};

// 수정용 스키마 (fixedCount 제외 — 생성 시 object refine은 여기서 적용하지 않음)
export const updateGroupBuyingSchema = createGroupBuyingFieldsSchema.omit({
  fixedCount: true,
});
export type UpdateGroupBuyingInput = z.input<typeof updateGroupBuyingSchema>;
export type UpdateGroupBuyingOutput = z.output<typeof updateGroupBuyingSchema>;
export const makeUpdateGroupBuyingSchema = (
  fixedCount: number,
  currentCount: number,
  prevLeaderCount: number,
) =>
  updateGroupBuyingSchema.refine(
    (data) => {
      const maxLeaderCount = fixedCount - (currentCount - prevLeaderCount);

      if (currentCount === prevLeaderCount) {
        return data.leaderCount < maxLeaderCount;
      } else {
        return data.leaderCount <= maxLeaderCount;
      }
    },
    {
      message:
        currentCount === prevLeaderCount
          ? "목표 수량 미만만 가능합니다."
          : "목표 수량을 초과할 수 없습니다.",
      path: ["leaderCount"],
    },
  );
