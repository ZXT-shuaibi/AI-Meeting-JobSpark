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
  mockCreateCareerOptimization,
  mockCreateCareerOptimizationProgressStream,
  mockGetCareerOptimizationTask,
  mockGetCareerResumeVersion,
} = vi.hoisted(() => ({
  mockCreateCareerOptimization: vi.fn(),
  mockCreateCareerOptimizationProgressStream: vi.fn(),
  mockGetCareerOptimizationTask: vi.fn(),
  mockGetCareerResumeVersion: vi.fn(),
}));

vi.mock("@/services/careerService", () => ({
  createCareerOptimization: mockCreateCareerOptimization,
  createCareerOptimizationProgressStream:
    mockCreateCareerOptimizationProgressStream,
  getCareerOptimizationTask: mockGetCareerOptimizationTask,
  getCareerResumeVersion: mockGetCareerResumeVersion,
}));

describe("ResumeOptimizePage", () => {
  beforeEach(() => {
    mockCreateCareerOptimization.mockReset();
    mockCreateCareerOptimizationProgressStream.mockReset();
    mockGetCareerOptimizationTask.mockReset();
    mockGetCareerResumeVersion.mockReset();
  });

  it("renders the real resume version and starts optimization with progress updates", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "resume-real-1",
      profileId: "profile-1",
      title: "高级前端工程师简历",
      content: "真实简历正文",
      markdownContent: "真实简历正文",
    });
    mockCreateCareerOptimization.mockResolvedValue({
      id: "task-123",
      status: "RUNNING",
      qualityScore: 71,
      suggestions: ["补充量化结果", "突出跨团队协作"],
    });
    mockGetCareerOptimizationTask.mockResolvedValue({
      id: "task-123",
      status: "SUCCEEDED",
      qualityScore: 88,
      suggestions: ["补充量化结果", "突出跨团队协作", "前置岗位关键词"],
    });
    mockCreateCareerOptimizationProgressStream.mockImplementation(
      async (_taskId, handlers) => {
        handlers.onConnected?.({ event: "connected" });
        handlers.onProgress?.({
          eventType: "PROGRESS",
          message: "正在生成优化建议",
        });
        handlers.onDone?.({
          eventType: "DONE",
          message: "优化完成",
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

    expect(await screen.findByDisplayValue("真实简历正文")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "开始优化" }));

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
    expect(await screen.findByText("正在生成优化建议")).toBeDefined();
    expect(await screen.findByText("前置岗位关键词")).toBeDefined();
  });

  it("surfaces a refresh error after the optimization stream finishes", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "resume-real-1",
      profileId: "profile-1",
      title: "高级前端工程师简历",
      content: "真实简历正文",
      markdownContent: "真实简历正文",
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
          message: "优化完成",
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

    await screen.findByDisplayValue("真实简历正文");
    fireEvent.click(screen.getByRole("button", { name: "开始优化" }));

    expect(await screen.findByText("refresh failed")).toBeDefined();
  });

  it("clears the previous optimization task and closes the old stream when switching to another resume id", async () => {
    const closeStream = vi.fn();
    mockGetCareerResumeVersion
      .mockResolvedValueOnce({
        id: "resume-01",
        profileId: "profile-1",
        title: "简历一",
        content: "简历一正文",
        markdownContent: "简历一正文",
      })
      .mockResolvedValueOnce({
        id: "resume-02",
        profileId: "profile-1",
        title: "简历二",
        content: "简历二正文",
        markdownContent: "简历二正文",
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

    await screen.findByDisplayValue("简历一正文");
    fireEvent.click(screen.getByRole("button", { name: "开始优化" }));
    expect(await screen.findByText("task-123")).toBeDefined();

    await act(async () => {
      await router.navigate(`${ROUTES.resumeOptimize}?id=resume-02`);
    });

    await screen.findByDisplayValue("简历二正文");

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
      screen.getByRole("link", { name: "上传文件" }).getAttribute("href"),
    ).toBe(ROUTES.previewResumeUpload);
    expect(
      screen.getByRole("link", { name: "返回简历列表" }).getAttribute("href"),
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
    expect(
      screen.queryByDisplayValue(/负责 AI 面试与简历联动平台的交互重组/),
    ).toBeNull();
    expect(
      screen.queryByText(
        "主导 AI 面试与简历联动平台工作台重构，串联上传、JD 对齐、优化反馈与训练复盘链路。",
      ),
    ).toBeNull();
    expect(screen.queryByText("结果表达")).toBeNull();
    expect(screen.queryByText("上传原始简历")).toBeNull();
    expect(
      screen.getByRole("button", { name: "开始优化" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByText("优化任务完成后，这里会展示改写建议和评估结果。"),
    ).toBeDefined();
  });
});
