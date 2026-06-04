import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/lib/constants";
import ResumeUploadPage from "./ResumeUploadPage";

const { mockUploadCareerResume } = vi.hoisted(() => ({
  mockUploadCareerResume: vi.fn(),
}));

vi.mock("@/services/careerService", () => ({
  uploadCareerResume: mockUploadCareerResume,
}));

type UploadResult = {
  documentId: string;
  profileId: string;
  resumeVersionId: string;
  status: string;
};

describe("ResumeUploadPage", () => {
  beforeEach(() => {
    mockUploadCareerResume.mockReset();
  });

  it("ignores a second file selection while an upload is already in flight", async () => {
    let resolveUpload: ((value: UploadResult) => void) | undefined;
    mockUploadCareerResume.mockImplementation(
      () =>
        new Promise<UploadResult>((resolve) => {
          resolveUpload = resolve;
        }),
    );

    render(
      <MemoryRouter initialEntries={[ROUTES.resumeUpload]}>
        <Routes>
          <Route path={ROUTES.resumeUpload} element={<ResumeUploadPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("选择简历文件"), {
      target: {
        files: [
          new File(["resume-a"], "resume-a.pdf", { type: "application/pdf" }),
        ],
      },
    });
    fireEvent.change(screen.getByLabelText("选择简历文件"), {
      target: {
        files: [
          new File(["resume-b"], "resume-b.pdf", { type: "application/pdf" }),
        ],
      },
    });

    await waitFor(() => {
      expect(mockUploadCareerResume).toHaveBeenCalledTimes(1);
    });

    resolveUpload?.({
      documentId: "doc-1",
      profileId: "profile-1",
      resumeVersionId: "resume-real-1",
      status: "PARSED",
    });

    expect(await screen.findByText("resume-real-1")).toBeDefined();
  });

  it("keeps the main-chain optimize CTA detached from preview sample ids before upload", () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.resumeUpload]}>
        <Routes>
          <Route path={ROUTES.resumeUpload} element={<ResumeUploadPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "进入定向优化" }).getAttribute("href"),
    ).toBe(ROUTES.resumeOptimize);
  });

  it("uploads a selected file and exposes the real detail / optimize links", async () => {
    mockUploadCareerResume.mockResolvedValue({
      documentId: "doc-1",
      profileId: "profile-1",
      resumeVersionId: "resume-real-1",
      status: "PARSED",
    });

    render(
      <MemoryRouter initialEntries={[ROUTES.resumeUpload]}>
        <Routes>
          <Route path={ROUTES.resumeUpload} element={<ResumeUploadPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const file = new File(["resume"], "resume.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(screen.getByLabelText("选择简历文件"), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(mockUploadCareerResume).toHaveBeenCalledWith(file);
    });

    expect(await screen.findByText("resume-real-1")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "查看详情" }).getAttribute("href"),
    ).toBe(ROUTES.resumeDetail.replace(":resumeVersionId", "resume-real-1"));
    expect(
      screen
        .getAllByRole("link", { name: "进入定向优化" })
        .every(
          (link) =>
            link.getAttribute("href") ===
            `${ROUTES.resumeOptimize}?id=resume-real-1`,
        ),
    ).toBe(true);
  });
});
