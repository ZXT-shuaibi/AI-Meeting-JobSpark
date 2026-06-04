import {
  generateCareerInterviewReport,
  getCareerInterviewReport,
  type CareerInterviewReport,
} from "@/services/careerService";
import type {
  QaReview,
  RadarPoint,
  ReviewFeedback,
} from "@/components/interview/report/types";

type UnknownRecord = Record<string, unknown>;

export type ReportQueryData = {
  report: CareerInterviewReport | null;
};

export type InterviewReportViewModel = {
  resumeScore: number | null;
  interviewScore: number | null;
  compositeScore: number | null;
  isCompositeEstimated: boolean;
  radarPoints: RadarPoint[];
  sortedSuggestions: string[];
  interviewDirection: string | null;
  qaReviews: QaReview[];
  reviewFeedback: ReviewFeedback;
};

const toRecord = (value: unknown): UnknownRecord | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
};

const toArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return value == null ? [] : [value];
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeScore = (value: unknown): number | null => {
  const parsed = toNumber(value);
  if (parsed === null) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const pickString = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return null;
};

const toStringArray = (value: unknown): string[] =>
  toArray(value)
    .map((item) => pickString(item))
    .filter((item): item is string => Boolean(item));

const uniq = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
};

const parseRadarPoint = (value: unknown): RadarPoint | null => {
  const payload = toRecord(value);
  if (!payload) {
    return null;
  }

  const label = pickString(
    payload.dimension,
    payload.label,
    payload.name,
    payload.metric,
  );
  const score = normalizeScore(
    payload.score ?? payload.value ?? payload.percent ?? payload.percentage,
  );

  if (!label || score === null) {
    return null;
  }

  return {
    label,
    value: score,
  };
};

const buildRadarPoints = (report: CareerInterviewReport | null): RadarPoint[] =>
  toArray(report?.radar)
    .map(parseRadarPoint)
    .filter((item): item is RadarPoint => Boolean(item))
    .slice(0, 8);

const extractFeedbackSummary = (feedback: unknown) => {
  if (typeof feedback === "string" && feedback.trim() !== "") {
    return feedback.trim();
  }

  const payload = toRecord(feedback);
  if (!payload) {
    return null;
  }

  return pickString(payload.summary, payload.feedback, payload.comment);
};

const extractFeedbackList = (feedback: unknown, key: string) => {
  const payload = toRecord(feedback);
  if (!payload) {
    return [];
  }
  return toStringArray(payload[key]);
};

const parseQaReview = (value: unknown, index: number): QaReview | null => {
  const payload = toRecord(value);
  if (!payload) {
    return null;
  }

  const question = pickString(payload.question, payload.title, payload.prompt);
  const answer = pickString(payload.answer, payload.response, payload.reply);

  if (!question && !answer) {
    return null;
  }

  return {
    question: question || "题目内容缺失",
    answer: answer || "回答内容缺失",
    score: normalizeScore(payload.score),
    feedback: extractFeedbackSummary(payload.feedback) ?? undefined,
    questionNumber: String(index + 1),
  };
};

const buildQaReviews = (report: CareerInterviewReport | null): QaReview[] =>
  toArray(report?.playback)
    .map((item, index) => parseQaReview(item, index))
    .filter((item): item is QaReview => Boolean(item));

const parseSuggestionText = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }

  const payload = toRecord(value);
  if (!payload) {
    return null;
  }

  const title = pickString(payload.title, payload.summary, payload.label);
  const action = pickString(
    payload.action,
    payload.suggestion,
    payload.comment,
    payload.description,
  );

  if (title && action) {
    return `${title}: ${action}`;
  }
  return title || action;
};

const parseSuggestionAction = (value: unknown): string | null => {
  const payload = toRecord(value);
  if (!payload) {
    return null;
  }

  return pickString(
    payload.action,
    payload.suggestion,
    payload.comment,
    payload.description,
    payload.title,
  );
};

const buildSortedSuggestions = (report: CareerInterviewReport | null) =>
  uniq(
    toArray(report?.suggestions)
      .map(parseSuggestionText)
      .filter((item): item is string => Boolean(item)),
  );

const extractResumeScore = (radarPoints: RadarPoint[]) => {
  const match = radarPoints.find((item) => /resume|简历/i.test(item.label));
  return match?.value ?? null;
};

const extractInterviewScore = (
  report: CareerInterviewReport | null,
  radarPoints: RadarPoint[],
) => {
  const playbackScores = toArray(report?.playback)
    .map((item) => normalizeScore(toRecord(item)?.score))
    .filter((item): item is number => item !== null);

  if (playbackScores.length > 0) {
    const average =
      playbackScores.reduce((sum, item) => sum + item, 0) /
      playbackScores.length;
    return normalizeScore(average);
  }

  const radarMatch = radarPoints.find((item) =>
    /interview|communication|answer|面试|回答/i.test(item.label),
  );
  return radarMatch?.value ?? null;
};

const buildReviewFeedback = (
  report: CareerInterviewReport | null,
  sortedSuggestions: string[],
): ReviewFeedback => {
  const playback = toArray(report?.playback);
  const highlights = uniq(
    playback.flatMap((item) =>
      extractFeedbackList(toRecord(item)?.feedback, "strengths"),
    ),
  ).slice(0, 3);
  const improvementTips = uniq(
    playback.flatMap((item) => [
      ...extractFeedbackList(toRecord(item)?.feedback, "missingPoints"),
      ...extractFeedbackList(toRecord(item)?.feedback, "weaknesses"),
    ]),
  ).slice(0, 3);
  const nextActions = uniq(
    toArray(report?.suggestions)
      .map(parseSuggestionAction)
      .filter((item): item is string => Boolean(item)),
  ).slice(0, 3);

  return {
    overallComment: pickString(report?.summary) ?? null,
    highlights,
    improvementTips,
    nextActions:
      nextActions.length > 0 ? nextActions : sortedSuggestions.slice(0, 3),
  };
};

export async function fetchInterviewReportQueryData(
  sessionId: string,
): Promise<ReportQueryData> {
  try {
    const report = await getCareerInterviewReport(sessionId);
    return { report };
  } catch (error) {
    console.warn(
      "[useInterviewReportData] report query failed, falling back to generate",
      error,
    );
    const report = await generateCareerInterviewReport(sessionId);
    return { report };
  }
}

export function buildInterviewReportViewModel(
  report: CareerInterviewReport | null,
): InterviewReportViewModel {
  const radarPoints = buildRadarPoints(report);
  const sortedSuggestions = buildSortedSuggestions(report);
  const qaReviews = buildQaReviews(report);
  const resumeScore = extractResumeScore(radarPoints);
  const interviewScore = extractInterviewScore(report, radarPoints);
  const rawCompositeScore = normalizeScore(report?.overallScore);
  const compositeScore =
    rawCompositeScore ??
    (() => {
      const available = [resumeScore, interviewScore].filter(
        (item): item is number => item !== null,
      );
      if (available.length === 0) {
        return null;
      }
      return normalizeScore(
        available.reduce((sum, item) => sum + item, 0) / available.length,
      );
    })();

  return {
    resumeScore,
    interviewScore,
    compositeScore,
    isCompositeEstimated:
      rawCompositeScore === null &&
      compositeScore !== null &&
      (resumeScore !== null || interviewScore !== null),
    radarPoints,
    sortedSuggestions,
    interviewDirection: null,
    qaReviews,
    reviewFeedback: buildReviewFeedback(report, sortedSuggestions),
  };
}
