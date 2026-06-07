import type {
  QaReview,
  RadarPoint,
  ReviewFeedback,
} from "@/components/interview/report/types";
import {
  generateCareerInterviewReport,
  getCareerInterviewReport,
  type CareerInterviewReport,
} from "@/services/careerService";
import { STATIC_PREVIEW_REPORT_SESSION_ID } from "@/lib/interviewReportRoute";

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

export const STATIC_PREVIEW_INTERVIEW_DIRECTION = "前端 / AI 产品岗位";

export const STATIC_PREVIEW_INTERVIEW_REPORT: CareerInterviewReport = {
  id: "mock-report-001",
  sessionId: STATIC_PREVIEW_REPORT_SESSION_ID,
  overallScore: 89,
  summary:
    "整体表现稳定，项目表达清晰，能够把业务目标、技术判断和结果复盘串起来，已经具备较强的一面表达基础。",
  radar: [
    { dimension: "简历匹配度", score: 84 },
    { dimension: "沟通表达", score: 91 },
    { dimension: "项目拆解", score: 88 },
    { dimension: "问题分析", score: 90 },
    { dimension: "岗位理解", score: 92 },
  ],
  playback: [
    {
      question: "请介绍一个你主导推进的项目，并说明你的核心贡献。",
      answer:
        "我负责把一套内部协作工具从零搭建到可交付版本，主导需求梳理、前端架构搭建和核心交互实现，最后把交付周期缩短到两周内。",
      score: 90,
      feedback: {
        summary: "回答结构完整，能清晰交代背景、动作和结果。",
        strengths: ["项目角色清晰", "结果导向明确"],
        missingPoints: ["可以补充更量化的业务指标"],
      },
    },
    {
      question: "如果再做一次，你会优先优化哪个环节？",
      answer:
        "我会更早拉齐设计和研发的边界，先把状态流转和异常场景定义清楚，减少后期反复返工。",
      score: 87,
      feedback: {
        summary: "有复盘意识，能指出流程问题。",
        strengths: ["体现了协作意识"],
        weaknesses: ["可以再补一个具体案例说明判断依据"],
      },
    },
    {
      question: "你如何判断这次交付是成功的？",
      answer:
        "我会看三个指标：业务是否真正上线使用、协作成本是否下降，以及后续是否能在这套方案上持续扩展。",
      score: 89,
      feedback: "评价维度明确，但还可以补充一两个实际数据。",
    },
  ],
  suggestions: [
    {
      title: "补强量化结果",
      action:
        "把项目收益改写成明确指标，例如效率提升、交付时间缩短或用户覆盖范围。",
    },
    {
      title: "增强岗位贴合度",
      action:
        "针对目标岗位，把 AI、协作设计、复杂交互等关键词前置到项目总结中。",
    },
    {
      title: "准备追问素材",
      action: "为关键项目各准备 1 个技术难点、1 个协作冲突和 1 个复盘优化点。",
    },
  ],
  traceId: "mock-trace-001",
  createTime: "2026-06-06T00:00:00Z",
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
    /interview|communication|answer|面试|回答|沟通/i.test(item.label),
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
