import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateCareerInterviewReport, mockGetCareerInterviewReport } =
  vi.hoisted(() => ({
    mockGenerateCareerInterviewReport: vi.fn(),
    mockGetCareerInterviewReport: vi.fn(),
  }));

vi.mock("@/services/careerService", () => ({
  generateCareerInterviewReport: (...args: unknown[]) =>
    mockGenerateCareerInterviewReport(...args),
  getCareerInterviewReport: (...args: unknown[]) =>
    mockGetCareerInterviewReport(...args),
}));

import {
  buildInterviewReportViewModel,
  fetchInterviewReportQueryData,
} from "@/hooks/interview/report/interviewReportData.shared";

describe("fetchInterviewReportQueryData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back to report generation when the stored report is missing", async () => {
    mockGetCareerInterviewReport.mockRejectedValue(new Error("report missing"));
    mockGenerateCareerInterviewReport.mockResolvedValue({
      id: "report-1",
      sessionId: "session-1",
      overallScore: 85,
      radar: [],
      playback: [],
      suggestions: [],
      summary: "generated",
    });

    const result = await fetchInterviewReportQueryData("session-1");

    expect(mockGetCareerInterviewReport).toHaveBeenCalledWith("session-1");
    expect(mockGenerateCareerInterviewReport).toHaveBeenCalledWith("session-1");
    expect(result.report?.id).toBe("report-1");
  });
});

describe("buildInterviewReportViewModel", () => {
  it("maps the HireSpark report payload into the report UI view model", () => {
    const viewModel = buildInterviewReportViewModel({
      id: "report-1",
      sessionId: "session-1",
      overallScore: 87,
      summary: "Overall strong ownership and communication.",
      radar: [
        {
          dimension: "Resume Match",
          score: 82,
          comment: "Resume alignment is solid.",
        },
        {
          dimension: "Communication",
          score: 91,
          comment: "Clear and structured answers.",
        },
      ],
      playback: [
        {
          question: "Tell me about a migration you led.",
          answer: "I introduced shared schema validation across the stack.",
          score: 88,
          feedback: {
            summary: "回答结构清晰",
            strengths: ["背景交代完整"],
            missingPoints: ["补充量化结果"],
          },
        },
        {
          question: "How did you validate the rollout?",
          answer: "We monitored error rates and staged the release.",
          score: 92,
          feedback: "追问回答到位",
        },
      ],
      suggestions: [
        {
          title: "Strengthen metrics",
          action: "Add quantified impact to the migration story.",
          priority: "HIGH",
        },
        {
          title: "Clarify architecture trade-offs",
          action: "Explain why you chose schema validation over ad-hoc guards.",
          priority: "MEDIUM",
        },
      ],
      traceId: "trace-1",
      createTime: "2026-06-04T12:00:00Z",
    });

    expect(viewModel.resumeScore).toBe(82);
    expect(viewModel.interviewScore).toBe(90);
    expect(viewModel.compositeScore).toBe(87);
    expect(viewModel.isCompositeEstimated).toBe(false);
    expect(viewModel.radarPoints).toEqual([
      { label: "Resume Match", value: 82 },
      { label: "Communication", value: 91 },
    ]);
    expect(viewModel.sortedSuggestions).toEqual([
      "Strengthen metrics: Add quantified impact to the migration story.",
      "Clarify architecture trade-offs: Explain why you chose schema validation over ad-hoc guards.",
    ]);
    expect(viewModel.qaReviews).toEqual([
      {
        question: "Tell me about a migration you led.",
        answer: "I introduced shared schema validation across the stack.",
        score: 88,
        feedback: "回答结构清晰",
        questionNumber: "1",
      },
      {
        question: "How did you validate the rollout?",
        answer: "We monitored error rates and staged the release.",
        score: 92,
        feedback: "追问回答到位",
        questionNumber: "2",
      },
    ]);
    expect(viewModel.reviewFeedback).toEqual({
      overallComment: "Overall strong ownership and communication.",
      highlights: ["背景交代完整"],
      improvementTips: ["补充量化结果"],
      nextActions: [
        "Add quantified impact to the migration story.",
        "Explain why you chose schema validation over ad-hoc guards.",
      ],
    });
  });
});
