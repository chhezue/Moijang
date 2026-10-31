import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthGate from "@/components/AuthGate";
import { LoginForm } from "@/app/(root)/(auth)/login/components/loginForm";
import { AUTH_QUERY_KEY, getMyInfo, login } from "@/apis/services/auth";
import { SnackbarProvider } from "@/providers/SnackbarProvider";
import type { UserDto } from "@/types/auth";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
  usePathname: () => "/login",
  useSearchParams: () => navigation.params,
}));
vi.mock("@/apis/services/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/apis/services/auth")>()),
  getMyInfo: vi.fn(),
  login: vi.fn(),
}));

const user: UserDto = {
  id: "1",
  loginId: "testuser",
  name: "테스트",
  universityEmail: "test@example.ac.kr",
  universityId: "university-1",
  universityName: "테스트대학교",
};

// useMe/useSetMe와 Query 캐시는 실제 구현을 사용한다.
describe("LoginForm → me 캐시 → AuthGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.params = new URLSearchParams();
    vi.mocked(getMyInfo).mockResolvedValue(null);
    vi.mocked(login).mockResolvedValue(user);
  });

  it.each([
    ["/dashboard/leading/abc123", "/dashboard/leading/abc123"],
    [null, "/"],
  ])("redirect=%s 로그인 성공 시 %s로 한 번만 이동한다", async (redirect, destination) => {
    if (redirect) navigation.params.set("redirect", redirect);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(
      <QueryClientProvider client={client}>
        <SnackbarProvider>
          <AuthGate mode="require-guest">
            <LoginForm />
          </AuthGate>
        </SnackbarProvider>
      </QueryClientProvider>,
    );

    fireEvent.change(await screen.findByLabelText("아이디"), { target: { value: "testuser" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "Password123!" } });
    const submit = screen.getByRole("button", { name: "로그인" });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(navigation.replace).not.toHaveBeenCalled();
    fireEvent.click(submit);

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(destination));
    expect(navigation.replace).toHaveBeenCalledTimes(1);
    expect(navigation.push).not.toHaveBeenCalled();
    expect(client.getQueryData(AUTH_QUERY_KEY)).toEqual(user);
    expect(login).toHaveBeenCalledWith({ loginId: "testuser", password: "Password123!" });
    expect(screen.queryByRole("button", { name: "로그인" })).not.toBeInTheDocument();
    view.unmount();
    client.clear();
  });
});
