import { test, expect, BrowserContext, Page } from "@playwright/test";

const USERS = {
  leader: { loginId: "leader_test", password: "Test1234!", name: "테스트총대" },
  p1: { loginId: "participant1", password: "Test1234!" },
};

const GB = {
  title: "[E2E] 공동구매 생성 테스트",
  productUrl: "https://example.com/product",
  description: "E2E 테스트용 공동구매입니다.",
  totalPrice: 50000,
  fixedCount: 5,
  shippingFee: 3000,
  leaderCount: 2,
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
};

async function login(page: Page, loginId: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("아이디").fill(loginId);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await page.waitForURL("/");
}

test.describe("Script 1: 공구 생성 플로우", () => {
  let leaderCtx: BrowserContext;
  let gbId: string;

  test.beforeAll(async ({ browser }) => {
    leaderCtx = await browser.newContext();
    const page = await leaderCtx.newPage();
    await login(page, USERS.leader.loginId, USERS.leader.password);
    await page.close();
  });

  test.afterAll(async () => {
    await leaderCtx.close();
  });

  test("1. 총대 로그인 확인", async () => {
    const page = await leaderCtx.newPage();
    await page.goto("/");
    await expect(page.getByText(USERS.leader.name)).toBeVisible();
    await page.close();
  });

  test("2. 공구 생성 3단계 폼 작성 및 제출", async () => {
    const page = await leaderCtx.newPage();
    await page.goto("/create");

    // Step 1: 상품 정보
    await page.getByLabel("공동구매 제목").fill(GB.title);
    await page.getByLabel("원본 상품 URL").fill(GB.productUrl);
    await page.getByLabel("상세 설명").fill(GB.description);
    await page.getByLabel("총 상품 가격 (원)").fill(String(GB.totalPrice));
    await page.getByLabel("목표 총 수량").fill(String(GB.fixedCount));
    await page.getByLabel("배송비 (원)").fill(String(GB.shippingFee));
    await page.getByLabel("상품 카테고리").click();
    await page.getByRole("option", { name: "생활/가공식품" }).click();
    await page.getByRole("button", { name: "다음" }).click();

    // Step 2: 참여 조건
    await page.getByLabel("모집 마감일").fill(GB.endDate);
    await page.getByLabel("나의 구매 수량").fill(String(GB.leaderCount));
    await page.getByRole("button", { name: "다음" }).click();

    // Step 3: 주의사항 동의
    await page.getByLabel("위 주의사항을 모두 확인하였으며, 이에 동의합니다.").click();
    await page.getByRole("button", { name: "완료" }).click();

    // 상세 페이지 이동 확인
    await page.waitForURL(/\/group-buying\/detail\/.+/);
    gbId = page.url().split("/").pop()!.split("?")[0];
    expect(gbId).toBeTruthy();

    await page.close();
  });

  test("3. 총대 UI 확인 (RECRUITING)", async () => {
    expect(gbId).toBeTruthy();
    const page = await leaderCtx.newPage();
    await page.goto(`/group-buying/detail/${gbId}`);

    // 상태 태그
    await expect(page.getByText("모집 중")).toBeVisible();
    // 총대 전용 버튼
    await expect(page.getByRole("button", { name: "공동구매 수정" })).toBeVisible();
    await expect(page.getByRole("button", { name: "인원 모집 취소" })).toBeVisible();
    // 참여하기 버튼 없음
    await expect(page.getByRole("button", { name: "공동구매 참여하기" })).not.toBeVisible();

    await page.close();
  });

  test("4. 비회원 UI 확인", async ({ browser }) => {
    expect(gbId).toBeTruthy();
    const guestCtx = await browser.newContext();
    const page = await guestCtx.newPage();
    await page.goto(`/group-buying/detail/${gbId}`);

    // 비로그인 안내 문구
    await expect(page.getByText("로그인 후 공구에 참여해 보세요!")).toBeVisible();
    // 액션 버튼 없음
    await expect(page.getByRole("button", { name: "공동구매 참여하기" })).not.toBeVisible();

    await guestCtx.close();
  });

  test("5. 미참여자 UI 확인", async ({ browser }) => {
    expect(gbId).toBeTruthy();
    const p1Ctx = await browser.newContext();
    const page = await p1Ctx.newPage();
    await login(page, USERS.p1.loginId, USERS.p1.password);
    await page.goto(`/group-buying/detail/${gbId}`);

    await expect(page.getByRole("button", { name: "공동구매 참여하기" })).toBeVisible();

    await p1Ctx.close();
  });
});
