import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ROUTES } from "@/lib/constants";
import InterviewIntroPage from "@/pages/interview/InterviewIntroPage";

const isStaticPreviewEnabledMock = vi.fn();

vi.mock("@/config/env", () => ({
  isStaticPreviewEnabled: () => isStaticPreviewEnabledMock(),
}));

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

describe("InterviewIntroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isStaticPreviewEnabledMock.mockReturnValue(false);
  });

  it("routes the start interview action back to the career workspace for real resume and jd binding", async () => {
    render(
      <MemoryRouter>
        <InterviewIntroPage />
      </MemoryRouter>,
    );

    const startLink = await screen.findByRole("link", {
      name: /start-interview/i,
    });

    expect(startLink.getAttribute("href")).toBe(ROUTES.career);
    expect(startLink.getAttribute("href")).not.toBe(ROUTES.interviewIntro);
  });

  it("hides the sample report entry when static preview is disabled", () => {
    render(
      <MemoryRouter>
        <InterviewIntroPage />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: /report-button/i })).toBeNull();
  });

  it("shows the sample report entry when static preview is enabled", () => {
    isStaticPreviewEnabledMock.mockReturnValue(true);

    render(
      <MemoryRouter>
        <InterviewIntroPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: /report-button/i }).getAttribute("href"),
    ).toBe(ROUTES.interviewReport);
  });
});
