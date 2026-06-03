import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/lib/constants";
import InterviewIntroPage from "@/pages/interview/InterviewIntroPage";

vi.mock("@/components/interview/intro/InterviewIntroHighlights", () => ({
  default: function MockInterviewIntroHighlights() {
    return <div>intro-highlights</div>;
  },
}));

vi.mock("@/components/interview/intro/InterviewIntroStepsCard", () => ({
  default: function MockInterviewIntroStepsCard() {
    return <div>intro-steps</div>;
  },
}));

vi.mock("@/components/interview/intro/introCopy", () => ({
  DEFAULT_INTERVIEW_INTRO_LOCALE: "zh-CN",
  getInterviewIntroCopy: () => ({
    badge: "badge",
    title: "intro-title",
    description: "intro-description",
    highlights: [],
    continueButton: "continue-interview",
    startButton: "start-interview",
    reportButton: "report-button",
    processTitle: "process-title",
    steps: [],
    processUpdateTitle: "update-title",
    processUpdateDescription: "update-description",
    sampleRadarTitle: "sample-radar-title",
    mockRadarPoints: [],
  }),
}));

vi.mock("@/services/interviewService", () => ({
  interviewService: {
    pageInterviewConversations: vi.fn().mockResolvedValue({
      records: [],
    }),
  },
}));

describe("InterviewIntroPage", () => {
  it("routes the start interview entry to the reachable no-session interview room", async () => {
    render(
      <MemoryRouter>
        <InterviewIntroPage />
      </MemoryRouter>,
    );

    const startLink = await screen.findByRole("link", {
      name: /start-interview/i,
    });

    expect(startLink.getAttribute("href")).toBe(ROUTES.interviewRoomEntry);
    expect(startLink.getAttribute("href")).not.toBe(ROUTES.interviewIntro);
  });
});
