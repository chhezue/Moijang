// 로그인 흐름에서 redirect 목적지를 계산하는 단일 지점.
// 패턴을 나열해서 막는 대신, 실제 URL 파서로 해석했을 때 origin이 그대로인지(=내부 경로인지)만 확인한다.
// base는 실제 도메인일 필요 없음 — "상대경로인가"만 판단하는 기준점이라 임의의 고정값이면 충분하고,
// 서버(레이아웃)/클라이언트(폼) 양쪽에서 window 없이도 똑같이 동작한다.
const RESOLUTION_BASE = "http://internal.invalid";

export function resolveRedirectTarget(raw: string | null | undefined): string {
  if (!raw) return "/";
  try {
    const resolved = new URL(raw, RESOLUTION_BASE);
    return resolved.origin === RESOLUTION_BASE
      ? resolved.pathname + resolved.search + resolved.hash
      : "/";
  } catch {
    return "/";
  }
}
