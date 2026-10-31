import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMe } from "@/hooks/useMe";
import * as authService from "@/apis/services/auth";
import type { UserDto } from "@/types/auth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

describe("useMe", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("조회 성공 시 유저 정보를 반환한다", async () => {
    const user: UserDto = {
      id: "1",
      loginId: "test",
      name: "테스트",
      universityEmail: "test@test.ac.kr",
      universityId: "u1",
      universityName: "테스트대",
    };
    vi.spyOn(authService, "getMyInfo").mockResolvedValue(user);

    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.data).toEqual(user);
  });

  it("확인된 guest(null)도 에러 없이 성공 상태로 반환한다", async () => {
    vi.spyOn(authService, "getMyInfo").mockResolvedValue(null);

    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("401 아닌 에러는 isError로 구분된다 (로그아웃으로 오판하면 안 됨)", async () => {
    vi.spyOn(authService, "getMyInfo").mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useMe(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });
});
