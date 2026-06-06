import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import InterviewReportPage from "@/pages/interview/InterviewReportPage";

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

describe("InterviewReportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads the HireSpark report session and displays the overall score", () => {
    useInterviewReportDataMock.mockReturnValue({
      isRecordLoading: false,
      recordError: null,
      resumeScore: 82,
      interviewScore: 90,
      compositeScore: 87,
      isCompositeEstimated: false,
      radarPoints: [
        { label: "Resume Match", value: 82 },
        { label: "Communication", value: 91 },
      ],
      sortedSuggestions: ["Add quantified impact to the migration story."],
      interviewDirection: null,
      qaReviews: [
        {
          question: "Tell me about a migration you led.",
          answer: "I introduced shared schema validation across the stack.",
          score: 88,
          feedback: "回答结构清晰",
          questionNumber: "1",
        },
      ],
      reviewFeedback: {
        overallComment: "Overall strong ownership and communication.",
        highlights: ["背景交代完整"],
        improvementTips: ["补充量化结果"],
        nextActions: ["Add quantified impact to the migration story."],
      },
    });

    render(
      <MemoryRouter
        initialEntries={["/career/interview-reports?sessionId=session-1"]}
      >
        <InterviewReportPage />
      </MemoryRouter>,
    );

    expect(useInterviewReportDataMock).toHaveBeenCalledWith("session-1");
    expect(screen.getByText("87")).toBeDefined();
    expect(
      screen.getByText("Overall strong ownership and communication."),
    ).toBeDefined();
    expect(
      screen.getByText("Tell me about a migration you led."),
    ).toBeDefined();
  });
});
