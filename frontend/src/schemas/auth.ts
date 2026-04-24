import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(4, "아이디는 4자 이상이어야 합니다.")
  .max(20, "아이디는 20자 이하이어야 합니다.")
  .regex(/^[a-zA-Z0-9_]+$/, "영문, 숫자, 언더스코어(_)만 사용 가능합니다.");

export const nameSchema = z
  .string()
  .min(2, "이름은 2자 이상이어야 합니다.")
  .max(20, "이름은 20자 이하이어야 합니다.");

export const emailLocalSchema = z
  .string()
  .min(1, "이메일 아이디를 입력해주세요.")
  .regex(/^[a-zA-Z0-9._%+\-]+$/, "올바른 형식이 아닙니다.");

export const emailSchema = z
  .string()
  .email("올바른 이메일 형식이 아닙니다.");

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .regex(/[a-zA-Z]/, "영문자를 포함해야 합니다.")
  .regex(/[0-9]/, "숫자를 포함해야 합니다.");

// 각 필드의 에러 메시지를 꺼내는 헬퍼
export const getError = (schema: z.ZodTypeAny, value: string): string | null => {
  const result = schema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0].message;
};
