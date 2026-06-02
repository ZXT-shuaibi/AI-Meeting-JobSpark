import { describe, expect, it } from "vitest";

import {
  buildInterviewReportDetailPath,
  getReportSessionIdFromLocation,
} from "@/lib/interviewReportRoute";

describe("interviewReportRoute", () => {
  it("builds the main interview report detail path from a sessionId", () => {
    expect(buildInterviewReportDetailPath("session-1")).toBe(
      "/career/interview-reports/session-1",
    );
  });

  it("reads the report sessionId from pathname before query fallback", () => {
    expect(
      getReportSessionIdFromLocation({
        pathname: "/career/interview-reports/session-1",
        state: null,
        search: "?sessionId=session-2",
      }),
    ).toBe("session-1");
  });

  it("falls back to the legacy query sessionId when the compatibility detail path is used", () => {
    expect(
      getReportSessionIdFromLocation({
        pathname: "/career/interview-reports/detail",
        state: null,
        search: "?sessionId=session-2",
      }),
    ).toBe("session-2");
  });

  it("reads the sessionId from the true legacy report detail query route", () => {
    expect(
      getReportSessionIdFromLocation({
        pathname: "/interview/report/detail",
        state: null,
        search: "?sessionId=session-legacy",
      }),
    ).toBe("session-legacy");
  });
});
