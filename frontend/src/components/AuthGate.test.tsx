import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthGate from "@/components/AuthGate";
import { useMe } from "@/hooks/useMe";

vi.mock("@/hooks/useMe", () => ({
  useMe: vi.fn(),
}));

const replace = vi.fn();
const searchParamsGet = vi.fn().mockReturnValue(null);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/dashboard",
  useSearchParams: () => ({ get: searchParamsGet }),
}));

const mockedUseMe = vi.mocked(useMe);

function mockUseMe(state: { data?: unknown; isPending?: boolean; isError?: boolean }) {
  mockedUseMe.mockReturnValue({
    data: undefined,
    isPending: false,
    isError: false,
    ...state,
  } as unknown as ReturnType<typeof useMe>);
}

describe("AuthGate", () => {
  beforeEach(() => {
    replace.mockReset();
    mockedUseMe.mockReset();
    searchParamsGet.mockReset().mockReturnValue(null);
  });

  it("로딩 중엔 children을 렌더하지 않고 로딩 UI를 보여준다", () => {
    mockUseMe({ isPending: true });
    render(
      <AuthGate mode="require-auth">
        <div>protected content</div>
      </AuthGate>,
    );
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  describe("require-auth", () => {
    it("확인된 미인증(null)이면 /login으로 redirect하고 children을 안 보여준다", () => {
      mockUseMe({ data: null });
      render(
        <AuthGate mode="require-auth">
          <div>protected content</div>
        </AuthGate>,
      );
      expect(replace).toHaveBeenCalledWith("/login?redirect=%2Fdashboard");
      expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    });

    it("401 아닌 에러면 에러 UI를 보여주고 로그인으로 오판해서 redirect하지 않는다", () => {
      mockUseMe({ isError: true });
      render(
        <AuthGate mode="require-auth">
          <div>protected content</div>
        </AuthGate>,
      );
      expect(replace).not.toHaveBeenCalled();
      expect(
        screen.getByText("일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요."),
      ).toBeInTheDocument();
      expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    });

    it("로그인된 유저면 children을 보여준다", () => {
      mockUseMe({ data: { id: "1", name: "테스트" } });
      render(
        <AuthGate mode="require-auth">
          <div>protected content</div>
        </AuthGate>,
      );
      expect(replace).not.toHaveBeenCalled();
      expect(screen.getByText("protected content")).toBeInTheDocument();
    });
  });

  describe("require-guest", () => {
    it("로그인된 유저면 /로 redirect하고 children을 안 보여준다 (redirect 파라미터 없을 때)", () => {
      mockUseMe({ data: { id: "1", name: "테스트" } });
      render(
        <AuthGate mode="require-guest">
          <div>login form</div>
        </AuthGate>,
      );
      expect(replace).toHaveBeenCalledWith("/");
      expect(screen.queryByText("login form")).not.toBeInTheDocument();
    });

    // 회귀 테스트: 로그인 페이지의 require-guest 가드와 로그인 폼이 같은 ['me'] 캐시를
    // 보고 각자 다른 곳으로 이동하려던 경쟁(race) 버그. AuthGate가 redirect 파라미터를
    // 읽어서 이동까지 전담하도록 고쳐서, 로그인 폼은 더 이상 네비게이션을 하지 않음.
    it("redirect 파라미터가 있으면 /가 아니라 그 경로로 이동한다", () => {
      searchParamsGet.mockImplementation((key: string) =>
        key === "redirect" ? "/dashboard/leading/abc123" : null,
      );
      mockUseMe({ data: { id: "1", name: "테스트" } });
      render(
        <AuthGate mode="require-guest">
          <div>login form</div>
        </AuthGate>,
      );
      expect(replace).toHaveBeenCalledWith("/dashboard/leading/abc123");
    });

    it("확인된 미인증(null)이면 children(폼)을 보여준다", () => {
      mockUseMe({ data: null });
      render(
        <AuthGate mode="require-guest">
          <div>login form</div>
        </AuthGate>,
      );
      expect(replace).not.toHaveBeenCalled();
      expect(screen.getByText("login form")).toBeInTheDocument();
    });

    // 실제로 로컬에서 재현해서 고쳤던 버그에 대한 회귀 테스트:
    // 백엔드 장애(401 아닌 에러) 상황에서도 로그인 폼 자체는 막지 않아야 함.
    it("401 아닌 에러여도 children(폼)을 막지 않고 보여준다 (회귀 테스트)", () => {
      mockUseMe({ isError: true });
      render(
        <AuthGate mode="require-guest">
          <div>login form</div>
        </AuthGate>,
      );
      expect(replace).not.toHaveBeenCalled();
      expect(screen.getByText("login form")).toBeInTheDocument();
      expect(
        screen.queryByText("일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요."),
      ).not.toBeInTheDocument();
    });
  });
});
