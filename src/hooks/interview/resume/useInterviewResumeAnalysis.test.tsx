import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useInterviewResumeAnalysis } from "@/hooks/interview/resume/useInterviewResumeAnalysis";
import {
  CAREER_INTERVIEW_BINDINGS_STORAGE_KEY,
  CAREER_WORKSPACE_STORAGE_KEY,
} from "@/lib/careerWorkspaceStorage";

const getCareerResumeVersionMock = vi.fn();

vi.mock("@/services/careerService", () => ({
  getCareerResumeVersion: (...args: unknown[]) =>
    getCareerResumeVersionMock(...args),
}));

describe("useInterviewResumeAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    getCareerResumeVersionMock.mockResolvedValue({
      id: "resume-real-1",
      profileId: "profile-1",
      title: "frontend-resume",
      content: "resume body",
      markdownContent: "resume body",
      createTime: "2026-06-06T10:00:00Z",
    });
  });

  it("loads the HireSpark bound resume version for an active interview session", async () => {
    window.localStorage.setItem(
      CAREER_WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        profileId: "profile-1",
        resumeVersionId: "resume-real-1",
      }),
    );

    const { result } = renderHook(() =>
      useInterviewResumeAnalysis({
        interviewerSessionId: "session-1",
      }),
    );

    await waitFor(() => {
      expect(result.current.resumeName).toBe("frontend-resume");
    });

    expect(getCareerResumeVersionMock).toHaveBeenCalledWith("resume-real-1");
    expect(result.current.resumePreviewSource).toBeUndefined();
    expect(result.current.resumePreviewError).toContain("PDF");
    expect(result.current.resumeUploadError).toBeNull();
  });

  it("prefers the persisted session binding over the mutable workspace snapshot", async () => {
    window.localStorage.setItem(
      CAREER_WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        profileId: "profile-1",
        resumeVersionId: "resume-workspace-latest",
      }),
    );
    window.localStorage.setItem(
      CAREER_INTERVIEW_BINDINGS_STORAGE_KEY,
      JSON.stringify({
        "session-1": {
          profileId: "profile-1",
          resumeVersionId: "resume-bound-session-1",
          jdId: "job-1",
          updatedAt: Date.now(),
        },
      }),
    );

    getCareerResumeVersionMock.mockResolvedValueOnce({
      id: "resume-bound-session-1",
      profileId: "profile-1",
      title: "session-bound-resume",
      content: "resume body",
      markdownContent: "resume body",
      createTime: "2026-06-06T10:00:00Z",
    });

    const { result } = renderHook(() =>
      useInterviewResumeAnalysis({
        interviewerSessionId: "session-1",
      }),
    );

    await waitFor(() => {
      expect(result.current.resumeName).toBe("session-bound-resume");
    });

    expect(getCareerResumeVersionMock).toHaveBeenCalledWith(
      "resume-bound-session-1",
    );
  });

  it("surfaces a workspace error when the interview session has no bound resume version", async () => {
    const { result } = renderHook(() =>
      useInterviewResumeAnalysis({
        interviewerSessionId: "session-1",
      }),
    );

    await waitFor(() => {
      expect(result.current.resumeUploadError).toContain("未找到");
    });

    expect(getCareerResumeVersionMock).not.toHaveBeenCalled();
    expect(result.current.resumePreviewError).toContain("未找到");
  });

  it("blocks in-page resume uploads and points users back to the career workspace", async () => {
    const { result } = renderHook(() =>
      useInterviewResumeAnalysis({
        interviewerSessionId: "session-1",
      }),
    );

    await act(async () => {
      await result.current.handleResumeFileSelect({
        target: {
          value: "resume.pdf",
        },
      } as never);
    });

    expect(result.current.resumeUploadError).toContain("简历工作台");
    expect(result.current.resumePreviewError).toContain("简历工作台");
  });
});
