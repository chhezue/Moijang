// 로그인/인증 흐름에서 redirect 목적지를 계산하는 단일 지점.
// middleware, (protected)/layout, loginForm, loginAction, (auth)/layout이 전부 이 함수를 거쳐야 함 —
// 각자 따로 계산하면서 (auth)/layout이 `?redirect=`를 놓친 게 GitHub #29 ①②의 원인이었음.
const SAFE_PATH_PATTERN = /^\/(?!\/|\\)/;

export function resolveRedirectTarget(raw: string | null | undefined): string {
  if (!raw) return "/";
  return SAFE_PATH_PATTERN.test(raw) ? raw : "/";
}
