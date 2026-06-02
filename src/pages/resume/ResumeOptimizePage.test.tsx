import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ROUTES } from "@/lib/constants";
import ResumeOptimizePage from "./ResumeOptimizePage";

describe("ResumeOptimizePage", () => {
  it("renders the resume and JD workspace with structured results", () => {
    render(
      <MemoryRouter initialEntries={[`${ROUTES.resumeOptimize}?id=resume-01`]}>
        <Routes>
          <Route path={ROUTES.resumeOptimize} element={<ResumeOptimizePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "简历定向优化",
      }),
    ).toBeDefined();
    expect(screen.getByLabelText("简历内容")).toBeDefined();
    expect(screen.getByLabelText("目标岗位链接")).toBeDefined();
    expect(screen.getByText("岗位匹配判断")).toBeDefined();
  });

  it("uses a working upload entry and keeps preview links self-contained", () => {
    render(
      <MemoryRouter initialEntries={[`${ROUTES.previewResumeOptimize}?id=resume-01`]}>
        <Routes>
          <Route path={ROUTES.previewResumeOptimize} element={<ResumeOptimizePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "上传文件" }).getAttribute("href")).toBe(
      ROUTES.previewResumeUpload,
    );
    expect(screen.getByRole("link", { name: "返回简历列表" }).getAttribute("href")).toBe(
      ROUTES.previewResumeList,
    );
  });
});
