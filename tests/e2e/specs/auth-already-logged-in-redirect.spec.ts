import { test, expect } from "@playwright/test";
import { login } from "../harness/fixtures";

const GB_ID = process.env.CONFIRMED_GB_ID!;

test("이미 로그인된 상태로 /login?redirect=X 진입 시 X로 이동해야 함 (GitHub #29 ②)", async ({
  page,
}) => {
  await login(page, process.env.TEST_LEADER_ID!, process.env.TEST_LEADER_PW!);

  const target = `/dashboard/leading/${GB_ID}`;
  await page.goto(`/login?redirect=${encodeURIComponent(target)}`);

  // 고치기 전엔 무조건 "/"로 튕겼음 — ?redirect= 값을 반영해야 함
  await expect(page).toHaveURL(target);
});

test("이미 로그인된 상태로 /login?redirect=//evil.com 진입 시 evil.com으로 가면 안 됨 (open-redirect 방지)", async ({
  page,
}) => {
  await login(page, process.env.TEST_LEADER_ID!, process.env.TEST_LEADER_PW!);

  await page.goto("/login?redirect=%2F%2Fevil.com");

  // "/"는 (home)/page.tsx가 즉시 /group-buying/list/all로 리다이렉트하므로 최종 도착지는 그쪽.
  // 여기서 확인하려는 건 evil.com으로 안 새는지 뿐.
  await expect(page).not.toHaveURL(/evil\.com/);
  await expect(page).toHaveURL(/^http:\/\/localhost:3000\//);
});
