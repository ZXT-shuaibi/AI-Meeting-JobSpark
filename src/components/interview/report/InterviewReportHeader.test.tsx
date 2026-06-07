import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import InterviewReportHeader from "@/components/interview/report/InterviewReportHeader";

describe("InterviewReportHeader", () => {
  it("renders the aligned report title and restart action", () => {
    render(
      <MemoryRouter>
        <InterviewReportHeader />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "面试表现报告" })).toBeDefined();
    expect(
      screen.getByText("综合评估 · 结果可用于后续训练与复盘"),
    ).toBeDefined();
    expect(screen.getByRole("link", { name: "重新面试" })).toBeDefined();
  });
});
