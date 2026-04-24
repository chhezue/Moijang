"use client";

/**
 * Core Web Vitals 보고용 훅 연결 지점.
 * `next/web-vitals` 미사용 시에도 레이아웃 import가 깨지지 않도록 no-op으로 둡니다.
 */
export function WebVitals() {
  return null;
}
