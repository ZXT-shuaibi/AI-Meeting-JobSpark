import { render, screen } from "@testing-library/react";
import { Outlet, RouterProvider, createMemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { appRoutes } from "@/app/router";
import { ROUTES } from "@/lib/constants";

const useAppSelectorMock = vi.fn();

vi.mock("@/store/hooks", () => ({
  useAppSelector: (
    selector: (state: { user: { isAuthenticated: boolean } }) => unknown,
  ) => useAppSelectorMock(selector),
}));

vi.mock("@/layouts/AppLayout", () => ({
  default: function MockAppLayout() {
    return (
      <div data-testid="app-layout">
        <Outlet />
      </div>
    );
  },
}));

vi.mock("@/components/auth/AuthGuard", () => ({
  default: function MockAuthGuard() {
    return <Outlet />;
  },
}));

vi.mock("@/pages/marketing/MarketingHomePage", () => ({
  default: function MockMarketingHomePage() {
    return <div>marketing-home-page</div>;
  },
}));

vi.mock("@/pages/auth/AuthPage", () => ({
  default: function MockAuthPage() {
    return <div>auth-page</div>;
  },
}));

vi.mock("@/pages/chat/ChatPage", () => ({
  default: function MockChatPage() {
    return <div>chat-page</div>;
  },
}));

vi.mock("@/pages/resume/ResumeListPage", () => ({
  default: function MockResumeListPage() {
    return <div>resume-list-page</div>;
  },
}));

vi.mock("@/pages/resume/ResumeUploadPage", () => ({
  default: function MockResumeUploadPage() {
    return <div>resume-upload-page</div>;
  },
}));

vi.mock("@/pages/resume/ResumeOptimizePage", () => ({
  default: function MockResumeOptimizePage() {
    return <div>resume-optimize-page</div>;
  },
}));

vi.mock("@/pages/resume/ResumeDetailPage", () => ({
  default: function MockResumeDetailPage() {
    return <div>resume-detail-page</div>;
  },
}));

vi.mock("@/pages/interview/InterviewIntroPage", () => ({
  default: function MockInterviewIntroPage() {
    return <div>interview-intro-page</div>;
  },
}));

vi.mock("@/pages/interview/InterviewPage", () => ({
  default: function MockInterviewPage() {
    return <div>interview-page</div>;
  },
}));

vi.mock("@/pages/interview/InterviewReportPage", () => ({
  default: function MockInterviewReportPage() {
    return <div>interview-report-page</div>;
  },
}));

vi.mock("@/pages/interview/InterviewReportDetailPage", () => ({
  default: function MockInterviewReportDetailPage() {
    return <div>interview-report-detail-page</div>;
  },
}));

describe("appRoutes", () => {
  beforeEach(() => {
    useAppSelectorMock.mockImplementation((selector) =>
      selector({ user: { isAuthenticated: false } }),
    );
  });

  it("keeps / on the marketing home when the user is not authenticated", async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.home],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("marketing-home-page")).toBeDefined();
    expect(screen.getByTestId("app-layout")).toBeDefined();
  });

  it("redirects authenticated users from / to /career", async () => {
    useAppSelectorMock.mockImplementation((selector) =>
      selector({ user: { isAuthenticated: true } }),
    );

    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.home],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("resume-list-page")).toBeDefined();
    expect(router.state.location.pathname).toBe(ROUTES.career);
  });

  it("loads the auth route lazily", async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.auth],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("auth-page")).toBeDefined();
    expect(screen.getByTestId("app-layout")).toBeDefined();
  });

  it("loads authenticated chat routes lazily", async () => {
    useAppSelectorMock.mockImplementation((selector) =>
      selector({ user: { isAuthenticated: true } }),
    );

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/chat/session-1"],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("chat-page")).toBeDefined();
  });

  it("matches the new /career/interviews/:sessionId route", async () => {
    useAppSelectorMock.mockImplementation((selector) =>
      selector({ user: { isAuthenticated: true } }),
    );

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/career/interviews/session-1"],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("interview-page")).toBeDefined();
    expect(router.state.location.pathname).toBe("/career/interviews/session-1");
  });

  it("keeps /career/interviews/room reachable as the no-session interview entry", async () => {
    useAppSelectorMock.mockImplementation((selector) =>
      selector({ user: { isAuthenticated: true } }),
    );

    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.interviewRoomEntry],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("interview-page")).toBeDefined();
    expect(router.state.location.pathname).toBe(ROUTES.interviewRoomEntry);
  });

  it("matches the new /career/interview-reports/:sessionId route", async () => {
    useAppSelectorMock.mockImplementation((selector) =>
      selector({ user: { isAuthenticated: true } }),
    );

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/career/interview-reports/session-1"],
    });

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByText("interview-report-detail-page"),
    ).toBeDefined();
    expect(router.state.location.pathname).toBe(
      "/career/interview-reports/session-1",
    );
  });

  it("matches the new /career/resumes/:resumeVersionId route", async () => {
    useAppSelectorMock.mockImplementation((selector) =>
      selector({ user: { isAuthenticated: true } }),
    );

    const router = createMemoryRouter(appRoutes, {
      initialEntries: ["/career/resumes/resume-1"],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("resume-detail-page")).toBeDefined();
    expect(router.state.location.pathname).toBe("/career/resumes/resume-1");
  });

  it("loads public preview resume routes without authentication", async () => {
    const router = createMemoryRouter(appRoutes, {
      initialEntries: [ROUTES.previewResumeList],
    });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("resume-list-page")).toBeDefined();
    expect(screen.getByTestId("app-layout")).toBeDefined();
  });
});
