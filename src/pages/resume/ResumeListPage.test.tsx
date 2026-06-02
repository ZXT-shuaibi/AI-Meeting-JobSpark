import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/constants";
import ResumeListPage from "./ResumeListPage";

describe("ResumeListPage", () => {
  it("focuses the page on resume actions instead of redesign explanation copy", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.resumeList]}>
        <Routes>
          <Route path={ROUTES.resumeList} element={<ResumeListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "简历工作台" })).toBeDefined();
    expect(screen.getByRole("link", { name: /上传新简历/ })).toBeDefined();
    expect(screen.queryByText(/AI-Meeting 的基座里/)).toBeNull();
  });

  it("keeps preview actions inside the preview namespace", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.previewResumeList]}>
        <Routes>
          <Route path={ROUTES.previewResumeList} element={<ResumeListPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /上传新简历/ }).getAttribute("href")).toBe(
      ROUTES.previewResumeUpload,
    );
    expect(screen.getAllByRole("link", { name: "查看详情" })[1]?.getAttribute("href")).toBe(
      `${ROUTES.previewResumeDetail}?id=resume-02`,
    );
    expect(screen.getAllByRole("link", { name: "进入优化" })[1]?.getAttribute("href")).toBe(
      `${ROUTES.previewResumeOptimize}?id=resume-02`,
    );
  });
});
