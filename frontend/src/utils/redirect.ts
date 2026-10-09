// 로그인 흐름에서 redirect 목적지를 계산하는 단일 지점.
// "/"로 시작하되 "//"나 "/\"로 시작하진 않는 내부 경로만 허용 — 그 외는 open-redirect로 보고 "/"로 떨어뜨림.
const SAFE_PATH_PATTERN = /^\/(?!\/|\\)/;

export function resolveRedirectTarget(raw: string | null | undefined): string {
  if (!raw) return "/";
  return SAFE_PATH_PATTERN.test(raw) ? raw : "/";
}
