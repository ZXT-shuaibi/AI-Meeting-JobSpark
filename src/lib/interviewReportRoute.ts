import { ROUTES } from "@/lib/constants";

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
  if (pathnameSessionId) {
    return decodeURIComponent(pathnameSessionId);
  }

  const stateSessionId =
    (location.state as ReportLocationState)?.sessionId?.trim() || "";
  if (stateSessionId) return stateSessionId;

  const fromSearch =
    new URLSearchParams(location.search || "").get("sessionId")?.trim() || "";
  return fromSearch || null;
};

export const buildReportSearch = (sessionId: string | null) =>
  sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";

export const buildInterviewReportDetailPath = (sessionId: string) =>
  ROUTES.interviewReportDetail.replace(
    ":sessionId",
    encodeURIComponent(sessionId),
  );
