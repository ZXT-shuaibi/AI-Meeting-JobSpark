import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/lib/constants";
import { CAREER_WORKSPACE_STORAGE_KEY } from "@/lib/careerWorkspaceStorage";
import ResumeListPage from "./ResumeListPage";

const { mockListCareerResumeVersions } = vi.hoisted(() => ({
  mockListCareerResumeVersions: vi.fn(),
}));

vi.mock("@/services/careerService", () => ({
  listCareerResumeVersions: mockListCareerResumeVersions,
}));

describe("ResumeListPage", () => {
  beforeEach(() => {
    mockListCareerResumeVersions.mockReset();
    window.localStorage.clear();
  });

  it("loads main-chain resumes from the persisted profile workspace", async () => {
    window.localStorage.setItem(
      CAREER_WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        profileId: "profile-1",
        resumeVersionId: "resume-real-2",
      }),
    );
    mockListCareerResumeVersions.mockResolvedValue([
      {
        id: "resume-real-1",
        profileId: "profile-1",
        versionNo: 1,
        title: "前端工程师简历",
        content: "负责 AI 面试前端工作台搭建",
        markdownContent: "负责 AI 面试前端工作台搭建",
        createTime: "2026-06-01T08:00:00Z",
      },
      {
        id: "resume-real-2",
        profileId: "profile-1",
        versionNo: 2,
        title: "AI 产品协同简历",
        content: "负责 AI Meeting / HireSpark 前端对齐",
        markdownContent: "负责 AI Meeting / HireSpark 前端对齐",
        createTime: "2026-06-02T08:00:00Z",
      },
    ]);

    render(
      <MemoryRouter initialEntries={[ROUTES.resumeList]}>
        <Routes>
          <Route path={ROUTES.resumeList} element={<ResumeListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "简历工作台" }),
    ).toBeDefined();
    expect(mockListCareerResumeVersions).toHaveBeenCalledWith("profile-1");
    expect(screen.getByText("前端工程师简历")).toBeDefined();
    expect(screen.getByText("AI 产品协同简历")).toBeDefined();
    expect(
      screen
        .getAllByRole("link", { name: "查看详情" })[1]
        ?.getAttribute("href"),
    ).toBe(ROUTES.resumeDetail.replace(":resumeVersionId", "resume-real-2"));
    expect(
      screen
        .getAllByRole("link", { name: "进入优化" })[1]
        ?.getAttribute("href"),
    ).toBe(`${ROUTES.resumeOptimize}?id=resume-real-2`);
    expect(screen.queryByText(/AI-Meeting 闭环看板/)).toBeNull();
  });

  it("keeps preview actions inside the preview namespace", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.previewResumeList]}>
        <Routes>
          <Route path={ROUTES.previewResumeList} element={<ResumeListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /上传新简历/ }).getAttribute("href"),
    ).toBe(ROUTES.previewResumeUpload);
    expect(
      screen
        .getAllByRole("link", { name: "查看详情" })[1]
        ?.getAttribute("href"),
    ).toBe(`${ROUTES.previewResumeDetail}?id=resume-02`);
    expect(
      screen
        .getAllByRole("link", { name: "进入优化" })[1]
        ?.getAttribute("href"),
    ).toBe(`${ROUTES.previewResumeOptimize}?id=resume-02`);
  });
});
