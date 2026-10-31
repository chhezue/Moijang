import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import UserMenu from "@/components/UserMenu";
import { AUTH_QUERY_KEY, logout } from "@/apis/services/auth";

const mocks = vi.hoisted(() => ({ push: vi.fn(), showSnackbar: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => "/dashboard/leading",
}));
vi.mock("@/providers/SnackbarProvider", () => ({
  useSnackbar: () => ({ showSnackbar: mocks.showSnackbar }),
}));
vi.mock("@/apis/services/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/apis/services/auth")>()),
  logout: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

function renderMenu() {
  const client = new QueryClient();
  const user = { id: "user-1", name: "테스트 사용자" };
  client.setQueryData(AUTH_QUERY_KEY, user);
  const view = render(
    <QueryClientProvider client={client}>
      <UserMenu displayName={user.name} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByText(user.name));
  return { client, user, view };
}

it("로그아웃 응답 대기 중에는 캐시를 유지하고 성공 후에만 비운다", async () => {
  let resolveLogout!: () => void;
  vi.mocked(logout).mockReturnValue(
    new Promise<void>((resolve) => {
      resolveLogout = resolve;
    }),
  );
  const { client, user, view } = renderMenu();
  fireEvent.click(await screen.findByRole("menuitem", { name: "로그아웃" }));

  expect(logout).toHaveBeenCalledTimes(1);
  expect(client.getQueryData(AUTH_QUERY_KEY)).toEqual(user);
  await act(async () => resolveLogout());
  await waitFor(() => expect(client.getQueryData(AUTH_QUERY_KEY)).toBeNull());
  expect(mocks.showSnackbar).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
  view.unmount();
  client.clear();
});

it("로그아웃 실패 시 사용자 캐시를 유지하고 재시도 안내를 보여준다", async () => {
  vi.mocked(logout).mockRejectedValue(new Error("network error"));
  const { client, user, view } = renderMenu();
  fireEvent.click(await screen.findByRole("menuitem", { name: "로그아웃" }));

  await waitFor(() =>
    expect(mocks.showSnackbar).toHaveBeenCalledWith(
      "로그아웃에 실패했습니다. 다시 시도해주세요.",
      "error",
    ),
  );
  expect(client.getQueryData(AUTH_QUERY_KEY)).toEqual(user);
  expect(mocks.push).not.toHaveBeenCalled();
  view.unmount();
  client.clear();
});
