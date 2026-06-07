import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SidebarInterviewList from "@/components/layout/sidebar/SidebarInterviewList";

describe("SidebarInterviewList", () => {
  it("highlights the matching record on preserved legacy report detail routes", () => {
    render(
      <SidebarInterviewList
        records={[
          {
            id: 1,
            userId: 1,
            sessionId: "session-legacy",
            interviewDirection: "Frontend Engineer",
            interviewScore: 92,
            startTime: "2026-06-02T12:00:00Z",
          },
        ]}
        activePathname="/interview/report/detail"
        activeSessionId="session-legacy"
        hasNextPage={false}
        isFetchingNextPage={false}
        onOpenRecord={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Frontend Engineer/i }).className,
    ).toContain("bg-secondary");
  });

  it("opens the selected record when clicked", () => {
    const onOpenRecord = vi.fn();

    render(
      <SidebarInterviewList
        records={[
          {
            id: 1,
            userId: 1,
            sessionId: "session-legacy",
            interviewDirection: "Frontend Engineer",
            interviewScore: 92,
            startTime: "2026-06-02T12:00:00Z",
          },
        ]}
        activePathname="/career/interview-reports/session-legacy"
        activeSessionId="session-legacy"
        hasNextPage={false}
        isFetchingNextPage={false}
        onOpenRecord={onOpenRecord}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Frontend Engineer/i }));

    expect(onOpenRecord).toHaveBeenCalledWith("session-legacy");
  });
});
