import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  createMemoryRouter,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
} from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/lib/constants";
import ResumeOptimizePage from "./ResumeOptimizePage";

const {
  mockCreateCareerInterview,
  mockCreateCareerJob,
  mockCreateCareerOptimization,
  mockCreateCareerOptimizationProgressStream,
  mockGetCareerOptimizationTask,
  mockGetCareerResumeVersion,
} = vi.hoisted(() => ({
  mockCreateCareerInterview: vi.fn(),
  mockCreateCareerJob: vi.fn(),
  mockCreateCareerOptimization: vi.fn(),
  mockCreateCareerOptimizationProgressStream: vi.fn(),
  mockGetCareerOptimizationTask: vi.fn(),
  mockGetCareerResumeVersion: vi.fn(),
}));

vi.mock("@/services/careerService", () => ({
  createCareerInterview: mockCreateCareerInterview,
  createCareerJob: mockCreateCareerJob,
  createCareerOptimization: mockCreateCareerOptimization,
  createCareerOptimizationProgressStream:
    mockCreateCareerOptimizationProgressStream,
  getCareerOptimizationTask: mockGetCareerOptimizationTask,
  getCareerResumeVersion: mockGetCareerResumeVersion,
}));

describe("ResumeOptimizePage", () => {
  beforeEach(() => {
    mockCreateCareerInterview.mockReset();
    mockCreateCareerJob.mockReset();
    mockCreateCareerOptimization.mockReset();
    mockCreateCareerOptimizationProgressStream.mockReset();
    mockGetCareerOptimizationTask.mockReset();
    mockGetCareerResumeVersion.mockReset();
  });

  it("renders the real resume version and starts optimization with progress updates", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "resume-real-1",
      profileId: "profile-1",
      title: "resume title",
      content: "resume body",
      markdownContent: "resume body",
    });
    mockCreateCareerOptimization.mockResolvedValue({
      id: "task-123",
      status: "RUNNING",
      qualityScore: 71,
      suggestions: ["Add quantified outcomes", "Highlight cross-team impact"],
    });
    mockGetCareerOptimizationTask.mockResolvedValue({
      id: "task-123",
      status: "SUCCEEDED",
      qualityScore: 88,
      suggestions: [
        "Add quantified outcomes",
        "Highlight cross-team impact",
        "Move job keywords upward",
      ],
    });
    mockCreateCareerOptimizationProgressStream.mockImplementation(
      async (_taskId, handlers) => {
        handlers.onConnected?.({ event: "connected" });
        handlers.onProgress?.({
          eventType: "PROGRESS",
          message: "Generating optimization suggestions",
        });
        handlers.onDone?.({
          eventType: "DONE",
          message: "Optimization completed",
        });
        return {
          close: vi.fn(),
        };
      },
    );

    render(
      <MemoryRouter
        initialEntries={[`${ROUTES.resumeOptimize}?id=resume-real-1`]}
      >
        <Routes>
          <Route
            path={ROUTES.resumeOptimize}
            element={<ResumeOptimizePage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByDisplayValue("resume body")).toBeDefined();

    fireEvent.click(screen.getByTestId("resume-optimize-start-optimization"));

    await waitFor(() => {
      expect(mockCreateCareerOptimization).toHaveBeenCalledWith({
        resumeVersionId: "resume-real-1",
        jdId: undefined,
        alignmentReportId: undefined,
      });
    });

    expect(await screen.findByText("task-123")).toBeDefined();
    await waitFor(() => {
      expect(screen.getAllByText("88").length).toBeGreaterThan(0);
    });
    expect(
      await screen.findByText("Generating optimization suggestions"),
    ).toBeDefined();
    expect(await screen.findByText("Move job keywords upward")).toBeDefined();
  });

  it("surfaces a refresh error after the optimization stream finishes", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "resume-real-1",
      profileId: "profile-1",
      title: "resume title",
      content: "resume body",
      markdownContent: "resume body",
    });
    mockCreateCareerOptimization.mockResolvedValue({
      id: "task-123",
      status: "RUNNING",
      qualityScore: 71,
      suggestions: [],
    });
    mockGetCareerOptimizationTask.mockRejectedValue(
      new Error("refresh failed"),
    );
    mockCreateCareerOptimizationProgressStream.mockImplementation(
      async (_taskId, handlers) => {
        handlers.onDone?.({
          eventType: "DONE",
          message: "Optimization completed",
        });
        return {
          close: vi.fn(),
        };
      },
    );

    render(
      <MemoryRouter
        initialEntries={[`${ROUTES.resumeOptimize}?id=resume-real-1`]}
      >
        <Routes>
          <Route
            path={ROUTES.resumeOptimize}
            element={<ResumeOptimizePage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("resume body");
    fireEvent.click(screen.getByTestId("resume-optimize-start-optimization"));

    expect(await screen.findByText("refresh failed")).toBeDefined();
  });

  it("creates a JD-backed interview session and navigates to the main-chain interview room", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "resume-real-1",
      profileId: "profile-1",
      title: "resume title",
      content: "resume body",
      markdownContent: "resume body",
    });
    mockCreateCareerJob.mockResolvedValue({
      id: "job-001",
    });
    mockCreateCareerInterview.mockResolvedValue({
      id: "session-001",
      status: "CREATED",
      currentTurnNo: 1,
      currentQuestion: {
        turnNo: 1,
        question: "Tell me about your latest project.",
      },
    });

    const router = createMemoryRouter(
      [
        {
          path: ROUTES.resumeOptimize,
          element: <ResumeOptimizePage />,
        },
        {
          path: ROUTES.interviewRoom,
          element: <div>interview-room-page</div>,
        },
      ],
      {
        initialEntries: [`${ROUTES.resumeOptimize}?id=resume-real-1`],
      },
    );

    render(<RouterProvider router={router} />);

    await screen.findByDisplayValue("resume body");
    fireEvent.change(screen.getByTestId("resume-optimize-jd-textarea"), {
      target: {
        value: "Need React, TypeScript, and frontend platform experience.",
      },
    });

    fireEvent.click(screen.getByTestId("resume-optimize-start-interview"));

    await waitFor(() => {
      expect(mockCreateCareerJob).toHaveBeenCalledWith({
        rawText: "Need React, TypeScript, and frontend platform experience.",
        sourceLocation: "",
        sourceType: "MANUAL",
      });
    });

    await waitFor(() => {
      expect(mockCreateCareerInterview).toHaveBeenCalledWith(
        "resume-real-1",
        "job-001",
      );
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/career/interviews/session-001",
      );
    });
    expect(await screen.findByText("interview-room-page")).toBeDefined();
  });

  it("clears the previous optimization task and closes the old stream when switching to another resume id", async () => {
    const closeStream = vi.fn();
    mockGetCareerResumeVersion
      .mockResolvedValueOnce({
        id: "resume-01",
        profileId: "profile-1",
        title: "resume one",
        content: "resume one body",
        markdownContent: "resume one body",
      })
      .mockResolvedValueOnce({
        id: "resume-02",
        profileId: "profile-1",
        title: "resume two",
        content: "resume two body",
        markdownContent: "resume two body",
      });
    mockCreateCareerOptimization.mockResolvedValue({
      id: "task-123",
      status: "RUNNING",
      qualityScore: 71,
      suggestions: [],
    });
    mockCreateCareerOptimizationProgressStream.mockResolvedValue({
      close: closeStream,
    });

    const router = createMemoryRouter(
      [
        {
          path: ROUTES.resumeOptimize,
          element: <ResumeOptimizePage />,
        },
      ],
      {
        initialEntries: [`${ROUTES.resumeOptimize}?id=resume-01`],
      },
    );

    render(<RouterProvider router={router} />);

    await screen.findByDisplayValue("resume one body");
    fireEvent.click(screen.getByTestId("resume-optimize-start-optimization"));
    expect(await screen.findByText("task-123")).toBeDefined();

    await act(async () => {
      await router.navigate(`${ROUTES.resumeOptimize}?id=resume-02`);
    });

    await screen.findByDisplayValue("resume two body");

    expect(closeStream).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("task-123")).toBeNull();
  });

  it("uses a working upload entry and keeps preview links self-contained", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "resume-01",
      title: "mock",
      content: "mock",
      markdownContent: "mock",
    });

    render(
      <MemoryRouter
        initialEntries={[`${ROUTES.previewResumeOptimize}?id=resume-01`]}
      >
        <Routes>
          <Route
            path={ROUTES.previewResumeOptimize}
            element={<ResumeOptimizePage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("mock");

    expect(
      screen.getByTestId("resume-optimize-upload-link").getAttribute("href"),
    ).toBe(ROUTES.previewResumeUpload);
    expect(
      screen.getByTestId("resume-optimize-back-link").getAttribute("href"),
    ).toBe(ROUTES.previewResumeList);
  });

  it("does not fall back to preview mock content on the main-chain route when the real resume load fails", async () => {
    mockGetCareerResumeVersion.mockRejectedValue(
      new Error("resume load failed"),
    );

    render(
      <MemoryRouter initialEntries={[`${ROUTES.resumeOptimize}?id=resume-01`]}>
        <Routes>
          <Route
            path={ROUTES.resumeOptimize}
            element={<ResumeOptimizePage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("resume load failed")).toBeDefined();
    expect(screen.queryByDisplayValue(/responsible for ai/i)).toBeNull();
    expect(
      (
        screen.getByTestId(
          "resume-optimize-start-optimization",
        ) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
