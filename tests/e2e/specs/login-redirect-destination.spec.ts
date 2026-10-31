/**
 * 로그인 리다이렉트 목적지 정확성 회귀 테스트.
 *
 * 버그: /login 페이지의 AuthGate(require-guest)와 LoginForm이 둘 다 ['me'] 캐시
 * 변경에 반응해서 각자 네비게이션을 시도함 — AuthGate는 하드코딩된 "/"로,
 * LoginForm은 redirect 쿼리파라미터로. 둘이 경쟁(race)해서 항상 AuthGate가
 * 이겨, 보호된 페이지에 딥링크로 들어왔다가 로그인하면 원래 목적지가 아니라
 * 항상 홈으로 튕기는 문제였음.
 *
 * 수정: AuthGate가 redirect 파라미터를 직접 읽어서 이동까지 전담하고,
 * LoginForm은 더 이상 네비게이션하지 않음 (단일 책임).
 */
import { test, expect } from '@playwright/test';

const GB_ID = process.env.CONFIRMED_GB_ID ?? '6a2e8a661d75894aad6d0b3e';
const LEADER = { loginId: process.env.TEST_LEADER_ID!, password: process.env.TEST_LEADER_PW! };

test.describe('로그인 후 원래 목적지로 복귀', () => {
  test.beforeEach(() => {
    test.skip(!LEADER.loginId || !LEADER.password, 'tests/.env에 TEST_LEADER_ID/PW가 없음');
  });

  test('보호된 페이지에 비로그인으로 접근 → 로그인 → 홈이 아니라 원래 페이지로 돌아간다', async ({
    page,
  }) => {
    const targetPath = `/dashboard/leading/${GB_ID}`;

    await page.goto(targetPath);
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 10000 });
    expect(page.url()).toContain(`redirect=${encodeURIComponent(targetPath)}`);

    await page.getByLabel('아이디').fill(LEADER.loginId);
    await page.getByLabel('비밀번호').fill(LEADER.password);
    await page.getByRole('button', { name: '로그인' }).click();

    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    expect(page.url()).toContain(targetPath);
  });
});
