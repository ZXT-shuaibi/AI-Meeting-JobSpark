import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/lib/constants";
import ResumeDetailPage from "./ResumeDetailPage";

const { mockGetCareerResumeVersion } = vi.hoisted(() => ({
  mockGetCareerResumeVersion: vi.fn(),
}));

vi.mock("@/services/careerService", () => ({
  getCareerResumeVersion: mockGetCareerResumeVersion,
}));

describe("ResumeDetailPage", () => {
  beforeEach(() => {
    mockGetCareerResumeVersion.mockReset();
  });

  it("does not fall back to mock resume content on the main-chain route when the real request fails", async () => {
    mockGetCareerResumeVersion.mockRejectedValue(
      new Error("resume load failed"),
    );

    render(
      <MemoryRouter initialEntries={["/career/resumes/resume-01"]}>
        <Routes>
          <Route path={ROUTES.resumeDetail} element={<ResumeDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("resume load failed")).toBeDefined();
    expect(screen.getByText("简历版本 resume-01")).toBeDefined();
    expect(screen.getByText("resumeVersionId: resume-01")).toBeDefined();
    expect(screen.getByText(/目标方向：/)).toBeDefined();
    expect(screen.queryByText("AI 产品与前端协同版简历")).toBeNull();
  });

  it("renders readable preview copy from mock resume data", async () => {
    mockGetCareerResumeVersion.mockResolvedValue({
      id: "",
      profileId: null,
      versionNo: null,
      title: null,
      content: null,
      markdownContent: null,
      createTime: null,
    });

    render(
      <MemoryRouter initialEntries={["/preview/resume/detail?id=resume-01"]}>
        <Routes>
          <Route
            path={ROUTES.previewResumeDetail}
            element={<ResumeDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("AI 产品与前端协同")).toBeDefined();
    expect(screen.getByText("个人摘要")).toBeDefined();
    expect(screen.getByText("工作经历")).toBeDefined();
  });
});
