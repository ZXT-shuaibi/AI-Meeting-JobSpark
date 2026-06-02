import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SidebarHistory from "@/components/layout/sidebar/SidebarHistory";

const navigateMock = vi.fn();
const useLocationMock = vi.fn();
const controllerMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => useLocationMock(),
  };
});

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

vi.mock("@/components/layout/sidebar/SidebarInterviewList", () => ({
  default: function MockSidebarInterviewList(props: {
    onOpenRecord: (sessionId: string) => void;
  }) {
    return (
      <button type="button" onClick={() => props.onOpenRecord("session-1")}>
        open-record
      </button>
    );
  },
}));

describe("SidebarHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocationMock.mockReturnValue({
      pathname: "/career/interview-reports",
      search: "",
      state: null,
    });
    controllerMock.mockReturnValue({
      view: "interviews",
      setView: vi.fn(),
      conversations: [],
      interviewRecords: [],
      hasNextPage: false,
      hasNextInterviewPage: false,
      isFetchingNextPage: false,
      isFetchingNextInterviewPage: false,
      handleScroll: vi.fn(),
    });
  });

  it("opens interview history records on the main-chain report detail route", () => {
    render(
      <MemoryRouter>
        <SidebarHistory />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "open-record" }));

    expect(navigateMock).toHaveBeenCalledWith(
      "/career/interview-reports/session-1",
      {
        state: { sessionId: "session-1" },
      },
    );
  });
});
