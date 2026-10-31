import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError } from "axios";
import apiClient from "@/apis/apiClient";
import { getMyInfo } from "@/apis/services/auth";
import type { UserDto } from "@/types/auth";

vi.mock("@/apis/apiClient", () => ({
  default: { get: vi.fn() },
}));

const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;

describe("getMyInfo", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("로그인된 유저면 UserDto를 그대로 반환한다", async () => {
    const user: UserDto = {
      id: "1",
      loginId: "test",
      name: "테스트",
      universityEmail: "test@test.ac.kr",
      universityId: "u1",
      universityName: "테스트대",
    };
    mockedGet.mockResolvedValueOnce({ data: user });

    await expect(getMyInfo()).resolves.toEqual(user);
    expect(mockedGet).toHaveBeenCalledWith("/api/auth/me");
  });

  it("401이면 확인된 guest로 보고 null을 반환한다", async () => {
    const error = new AxiosError("Unauthorized");
    error.response = { status: 401 } as AxiosError["response"];
    mockedGet.mockRejectedValueOnce(error);

    await expect(getMyInfo()).resolves.toBeNull();
  });

  it("401이 아닌 에러(네트워크/5xx)는 로그아웃으로 오판하지 않고 그대로 던진다", async () => {
    const error = new AxiosError("Internal Server Error");
    error.response = { status: 500 } as AxiosError["response"];
    mockedGet.mockRejectedValueOnce(error);

    await expect(getMyInfo()).rejects.toBe(error);
  });
});
