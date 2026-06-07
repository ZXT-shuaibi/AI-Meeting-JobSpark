import { render, screen } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SidebarHistory from "@/components/layout/sidebar/SidebarHistory";

const controllerMock = vi.fn();

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: function MockScrollArea(
    props: React.HTMLAttributes<HTMLDivElement>,
  ) {
    return <div {...props}>{props.children}</div>;
  },
}));

vi.mock("@/hooks/layout/useSidebarHistoryController", () => ({
  useSidebarHistoryController: (...args: unknown[]) => controllerMock(...args),
}));

vi.mock("@/components/layout/sidebar/SidebarSessionList", () => ({
  default: function MockSidebarSessionList() {
    return <div>session-list</div>;
  },
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

describe("SidebarHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLocation).mockReturnValue({
      pathname: "/chat",
      search: "",
      hash: "",
      state: null,
      key: "test",
    });
    controllerMock.mockReturnValue({
      view: "sessions",
      conversations: [],
      hasNextPage: false,
      isFetchingNextPage: false,
      handleScroll: vi.fn(),
    });
  });

  it("shows only session history on the aligned main chain", () => {
    render(
      <MemoryRouter>
        <SidebarHistory />
      </MemoryRouter>,
    );

    expect(screen.getByText("历史会话")).toBeDefined();
    expect(screen.getByText("session-list")).toBeDefined();
    expect(screen.queryByText("历史面试")).toBeNull();
  });

  it("renders nothing when the sidebar is collapsed", () => {
    const { container } = render(
      <MemoryRouter>
        <SidebarHistory isCollapsed />
      </MemoryRouter>,
    );

    expect(container.innerHTML).toBe("");
  });
});
