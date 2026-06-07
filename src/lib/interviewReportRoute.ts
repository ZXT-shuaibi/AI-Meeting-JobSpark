import { isStaticPreviewEnabled } from "@/config/env";
import { ROUTES } from "@/lib/constants";

export const STATIC_PREVIEW_REPORT_SESSION_ID = "mock-session-001";

type ReportLocationState = {
  sessionId?: string;
} | null;

export const getReportSessionIdFromLocation = (location: {
  state: unknown;
  pathname?: string;
  search?: string;
}) => {
  const pathMatch = location.pathname?.match(
    /^\/career\/interview-reports\/([^/?#]+)$/u,
  );
  const pathnameSessionId = pathMatch?.[1]?.trim() || "";
  if (pathnameSessionId && pathnameSessionId !== "detail") {
    return decodeURIComponent(pathnameSessionId);
  }

  const stateSessionId =
    (location.state as ReportLocationState)?.sessionId?.trim() || "";
  if (stateSessionId) return stateSessionId;

  const fromSearch =
    new URLSearchParams(location.search || "").get("sessionId")?.trim() || "";
  if (fromSearch) {
    return fromSearch;
  }

  return isStaticPreviewEnabled() ? STATIC_PREVIEW_REPORT_SESSION_ID : null;
};

export const buildReportSearch = (sessionId: string | null) =>
  sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";

export const buildInterviewReportDetailPath = (sessionId: string) =>
  ROUTES.interviewReportDetail.replace(
    ":sessionId",
    encodeURIComponent(sessionId),
  );
