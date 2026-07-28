import { test, expect } from "@playwright/test";

test("잘못된 비밀번호로 로그인 시 에러 메시지를 보여주고 페이지에 머물러야 함", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/login");

  await page.getByLabel("아이디").fill(process.env.TEST_LEADER_ID!);
  await page.getByLabel("비밀번호").fill("wrong-password-xyz");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page.getByText("아이디 또는 비밀번호가 올바르지 않습니다.")).toBeVisible({
    timeout: 5000,
  });
  await expect(page).toHaveURL(/\/login/);
});
