export const BANK_NAMES = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "NH농협은행",
  "IBK기업은행",
  "SC제일은행",
  "카카오뱅크",
  "케이뱅크",
] as const;

export type BankName = (typeof BANK_NAMES)[number];
