import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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

describe("ResumeOptimizePage copy", () => {
  beforeEach(() => {
    mockCreateCareerInterview.mockReset();
    mockCreateCareerJob.mockReset();
    mockCreateCareerOptimization.mockReset();
    mockCreateCareerOptimizationProgressStream.mockReset();
    mockGetCareerOptimizationTask.mockReset();
    mockGetCareerResumeVersion.mockReset();
  });

  it("renders readable Chinese copy on the main optimize workspace", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "resume-real-1",
      profileId: "profile-1",
      title: "前端工程师简历",
      content: "resume body",
      markdownContent: "resume body",
    });

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

    expect(
      await screen.findByRole("heading", { name: "简历定向优化" }),
    ).toBeDefined();
    expect(screen.getByText("返回简历列表")).toBeDefined();
    expect(screen.getByText("简历输入")).toBeDefined();
    expect(screen.getByText("岗位描述")).toBeDefined();
    expect(screen.getByRole("button", { name: /开始优化/ })).toBeDefined();
  });
});
