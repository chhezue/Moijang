import { test, expect } from '@playwright/test';

test('대시보드 직접 접근 → 로그인 → 원래 URL과 대시보드 화면 복구', async ({ page }) => {
  const targetPath = '/dashboard/leading';
  const credentials = { loginId: 'redirect_test', password: 'Password123!' };
  const user = {
    id: 'redirect-user',
    loginId: credentials.loginId,
    name: '리다이렉트 테스트',
    universityEmail: 'redirect@example.ac.kr',
    universityId: 'test-university',
    universityName: '테스트대학교',
  };
  let authenticated = false;

  // 서버 데이터와 계정에 의존하지 않고 실제 폼·캐시·Next 라우터를 검증한다.
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? user : {} }),
  );
  await page.route('**/api/auth/login', async (route) => {
    expect(route.request().postDataJSON()).toEqual(credentials);
    authenticated = true;
    await route.fulfill({ json: user });
  });
  await page.route('**/api/group-buying/my-create?*', (route) =>
    route.fulfill({ json: { items: [], total: 0 } }),
  );

  await page.goto(targetPath);
  await expect(page).toHaveURL(
    (url) => url.pathname === '/login' && url.searchParams.get('redirect') === targetPath,
  );
  await expect(page.getByText('공구를 선택하세요', { exact: true })).toBeHidden();

  await page.getByLabel('아이디').fill(credentials.loginId);
  await page.getByLabel('비밀번호').fill(credentials.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();

  await expect(page).toHaveURL((url) => url.pathname === targetPath && url.search === '');
  await expect(page.getByText('공구를 선택하세요', { exact: true })).toBeVisible();
  await expect(page.getByLabel('비밀번호')).toBeHidden();
  // URL 변경 직후뿐 아니라 보호된 화면이 렌더된 뒤에도 목적지를 확인한다.
  await expect(page).toHaveURL((url) => url.pathname === targetPath && url.search === '');
});
