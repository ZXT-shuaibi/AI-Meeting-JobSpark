import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InterviewReportPage from "./InterviewReportPage";

const useInterviewReportDataMock = vi.fn();

vi.mock("@/hooks/interview/report/useInterviewReportData", () => ({
  useInterviewReportData: (...args: unknown[]) =>
    useInterviewReportDataMock(...args),
}));

vi.mock("@/components/interview/report/InterviewReportHeader", () => ({
  default: function MockInterviewReportHeader() {
    return <div>report-header</div>;
  },
}));

describe("InterviewReportPage copy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInterviewReportDataMock.mockReturnValue({
      isRecordLoading: false,
      recordError: null,
      resumeScore: null,
      interviewScore: null,
      compositeScore: null,
      isCompositeEstimated: false,
      radarPoints: [],
      sortedSuggestions: [],
      interviewDirection: null,
      qaReviews: [],
      reviewFeedback: {
        overallComment: null,
        highlights: [],
        improvementTips: [],
        nextActions: [],
      },
    });
  });

  it("shows readable Chinese empty-state copy when there is no session id", () => {
    render(
      <MemoryRouter initialEntries={["/career/interview-reports"]}>
        <InterviewReportPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("当前页不提供报告历史列表")).toBeDefined();
    expect(screen.getByText("前往简历工作台")).toBeDefined();
    expect(screen.getByText("前往 AI 面试")).toBeDefined();
  });
});
