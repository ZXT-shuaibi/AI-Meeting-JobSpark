import service from "@/lib/request";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  finishCareerInterview,
  getCareerInterview,
  getCareerInterviewNextQuestion,
  submitCareerInterviewAnswer,
  type CareerInterviewSession,
  type CareerInterviewTurn,
} from "@/services/careerService";

export interface InterviewRecordResult {
  id: number;
  userId: number;
  sessionId: string;
  resumeScore?: number | null;
  interviewScore?: number | null;
  interviewStatus?: string | null;
  questionCount?: number | null;
  compositeScore?: number | null;
  totalScore?: number | null;
  finalScore?: number | null;
  interviewSuggestions?: string | null;
  interviewSuggestionsMap?: Record<string, string> | null;
  interviewDirection?: string | null;
  sessionSnapshotJson?: string | null;
  radarChart?: InterviewRadarChartResult | null;
  radarDimensions?: InterviewRadarMetric[] | null;
  radarMetrics?: InterviewRadarMetric[] | null;
  radarPoints?: InterviewRadarMetric[] | null;
  playbackItems?: InterviewQaReview[] | null;
  qaReviews?: InterviewQaReview[] | null;
  questionAnswers?: InterviewQaReview[] | null;
  interviewQaList?: InterviewQaReview[] | null;
  reviewFeedback?: InterviewReviewFeedbackResult | null;
  startTime?: string | null;
  endTime?: string | null;
  durationSeconds?: number | null;
  createTime?: string;
  updateTime?: string;
}

export interface InterviewReviewFeedbackResult {
  overallComment?: string | null;
  highlights?: string[] | null;
  improvementTips?: string[] | null;
  nextActions?: string[] | null;
}

export interface InterviewRadarMetric {
  label?: string | null;
  value?: number | string | null;
}

export interface InterviewQaReview {
  seq?: number | null;
  questionNumber?: string | null;
  question?: string | null;
  answer?: string | null;
  score?: number | string | null;
  feedback?: string | null;
  isFollowUp?: boolean | null;
  followUpNeeded?: boolean | null;
  followUpCount?: number | string | null;
}

export interface InterviewRadarChartResult {
  resumeScore?: number | null;
  interviewPerformance?: number | null;
  demeanorEvaluation?: number | null;
  professionalSkills?: number | null;
  potentialIndex?: number | null;
  radarMetrics?: InterviewRadarMetric[] | null;
  radarPoints?: InterviewRadarMetric[] | null;
  interviewScore?: number | null;
  totalScore?: number | null;
  [key: string]: unknown;
}

export interface AnswerInterviewQuestionParams {
  sessionId: string;
  questionNumber: string;
  answerContent?: string;
  audioFile?: File;
  requestId?: string;
}

export interface EvaluateInterviewDemeanorParams {
  sessionId: string;
  userPhoto: Blob;
  fileName?: string;
}

export interface AnswerInterviewQuestionResult {
  questionNumber?: string;
  questionContent?: string;
  score?: number;
  totalScore?: number;
  isSuccess?: boolean;
  errorMessage?: string;
  feedback?: string;
  nextQuestion?: string | null;
  nextQuestionNumber?: string | null;
  isFollowUp?: boolean;
  followUpNeeded?: boolean;
  followUpCount?: number;
  askToUser?: string | null;
  missingPoints?: string[] | Record<string, string>;
  finished?: boolean;
}

type UnknownRecord = Record<string, unknown>;

const toRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const pickFirst = (source: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }
  return undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
};

const toNullableString = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  return toStringValue(value);
};

const toNumberValue = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const toBooleanValue = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "n"].includes(normalized)) {
      return false;
    }
  }
  return undefined;
};

const toStringMap = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const source = value as Record<string, unknown>;
  const mapped: Record<string, string> = {};
  Object.entries(source).forEach(([key, entry]) => {
    const normalized = toStringValue(entry);
    if (normalized) {
      mapped[key] = normalized;
    }
  });
  return Object.keys(mapped).length > 0 ? mapped : undefined;
};

const toMissingPoints = (
  value: unknown,
): AnswerInterviewQuestionResult["missingPoints"] => {
  if (Array.isArray(value)) {
    const points = value
      .map((item) => toStringValue(item))
      .filter((item): item is string => Boolean(item));
    return points.length > 0 ? points : undefined;
  }
  const mapped = toStringMap(value);
  if (mapped) {
    return mapped;
  }
  const single = toStringValue(value);
  return single ? [single] : undefined;
};

export const normalizeInterviewAnswer = (
  payload: AnswerInterviewQuestionResult,
): AnswerInterviewQuestionResult => {
  const source = toRecord(payload);
  const isSuccess =
    toBooleanValue(pickFirst(source, ["isSuccess", "is_success", "success"])) ??
    true;
  const isFollowUp =
    toBooleanValue(pickFirst(source, ["isFollowUp", "is_follow_up"])) ?? false;
  const followUpNeeded =
    toBooleanValue(pickFirst(source, ["followUpNeeded", "follow_up_needed"])) ??
    payload.followUpNeeded;
  const finished =
    toBooleanValue(
      pickFirst(source, [
        "finished",
        "isFinished",
        "is_finished",
        "interviewFinished",
        "interview_finished",
        "done",
      ]),
    ) ?? false;
  const askToUser = toNullableString(
    pickFirst(source, ["askToUser", "ask_to_user"]),
  );
  const nextQuestion =
    toNullableString(
      pickFirst(source, [
        "nextQuestion",
        "next_question",
        "followUpQuestion",
        "follow_up_question",
      ]),
    ) ??
    askToUser ??
    payload.nextQuestion;

  return {
    ...payload,
    questionNumber:
      toStringValue(pickFirst(source, ["questionNumber", "question_number"])) ??
      payload.questionNumber,
    questionContent:
      toStringValue(
        pickFirst(source, ["questionContent", "question_content"]),
      ) ?? payload.questionContent,
    score: toNumberValue(pickFirst(source, ["score"])) ?? payload.score,
    totalScore:
      toNumberValue(
        pickFirst(source, ["totalScore", "total_score", "interviewScore"]),
      ) ?? payload.totalScore,
    isSuccess,
    errorMessage:
      toStringValue(
        pickFirst(source, ["errorMessage", "error_message", "message"]),
      ) ?? payload.errorMessage,
    feedback:
      toStringValue(
        pickFirst(source, ["feedback", "scoreComment", "score_comment"]),
      ) ?? payload.feedback,
    nextQuestion,
    nextQuestionNumber:
      toNullableString(
        pickFirst(source, ["nextQuestionNumber", "next_question_number"]),
      ) ?? payload.nextQuestionNumber,
    isFollowUp,
    followUpNeeded,
    followUpCount:
      toNumberValue(pickFirst(source, ["followUpCount", "follow_up_count"])) ??
      payload.followUpCount,
    askToUser: askToUser ?? payload.askToUser,
    missingPoints:
      toMissingPoints(pickFirst(source, ["missingPoints", "missing_points"])) ??
      payload.missingPoints,
    finished,
  };
};

const normalizeRequiredQuestionNumber = (questionNumber: string): string => {
  const normalized = questionNumber?.trim();
  if (normalized) {
    return normalized;
  }
  throw new AppError(
    ErrorCode.CLIENT_VALIDATION_ERROR,
    "questionNumber is required for interview answer submission",
  );
};

const MAIN_CHAIN_FINISHED_STATUSES = new Set([
  "FINISHED",
  "COMPLETED",
  "CLOSED",
  "REPORT_READY",
]);

const toTrimmedStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => toStringValue(item))
    .filter((item): item is string => Boolean(item));
};

const toAnswerQuestionNumber = (turnNo: number | null | undefined) =>
  turnNo == null ? undefined : String(turnNo);

const isCareerFollowUpTurn = (turn: CareerInterviewTurn | null | undefined) =>
  (turn?.turnType || "").toUpperCase().includes("FOLLOW");

const isMainChainInterviewFinished = (
  session: CareerInterviewSession | null | undefined,
) => {
  const normalizedStatus = session?.status?.trim().toUpperCase() || "";
  if (MAIN_CHAIN_FINISHED_STATUSES.has(normalizedStatus)) {
    return true;
  }
  return !session?.currentQuestion?.question?.trim();
};

const summarizeCareerFeedback = (
  feedback: Record<string, unknown> | null | undefined,
) => {
  if (!feedback) {
    return undefined;
  }

  const summary = toStringValue(
    pickFirst(feedback, ["summary", "feedback", "comment"]),
  );
  if (summary) {
    return summary;
  }

  const fallbacks = [
    ...toTrimmedStringArray(feedback.strengths),
    ...toTrimmedStringArray(feedback.weaknesses),
    ...toTrimmedStringArray(feedback.missingPoints),
  ];
  return fallbacks[0];
};

const extractCareerMissingPoints = (
  feedback: Record<string, unknown> | null | undefined,
) => {
  if (!feedback) {
    return undefined;
  }
  return toMissingPoints(feedback.missingPoints ?? feedback.gaps);
};

const mapCareerSessionQuestion = (
  session: CareerInterviewSession,
): AnswerInterviewQuestionResult => {
  const currentQuestion = session.currentQuestion;
  const finished = isMainChainInterviewFinished(session);
  return normalizeInterviewAnswer({
    isSuccess: true,
    questionNumber: toAnswerQuestionNumber(currentQuestion?.turnNo),
    questionContent: currentQuestion?.question ?? undefined,
    nextQuestion: finished ? null : (currentQuestion?.question ?? null),
    nextQuestionNumber: finished
      ? null
      : (toAnswerQuestionNumber(currentQuestion?.turnNo) ?? null),
    isFollowUp: !finished && isCareerFollowUpTurn(currentQuestion),
    followUpCount: !finished && isCareerFollowUpTurn(currentQuestion) ? 1 : 0,
    finished,
  });
};

const mapCareerTurnAnswer = (
  answeredTurn: CareerInterviewTurn,
  session: CareerInterviewSession,
): AnswerInterviewQuestionResult => {
  const finished = isMainChainInterviewFinished(session);
  const nextQuestion = session.currentQuestion;
  return normalizeInterviewAnswer({
    isSuccess: true,
    questionNumber: toAnswerQuestionNumber(answeredTurn.turnNo),
    questionContent: answeredTurn.question ?? undefined,
    score: answeredTurn.score ?? undefined,
    feedback: summarizeCareerFeedback(answeredTurn.feedback ?? undefined),
    missingPoints: extractCareerMissingPoints(
      answeredTurn.feedback ?? undefined,
    ),
    nextQuestion: finished ? null : (nextQuestion?.question ?? null),
    nextQuestionNumber: finished
      ? null
      : (toAnswerQuestionNumber(nextQuestion?.turnNo) ?? null),
    isFollowUp: !finished && isCareerFollowUpTurn(nextQuestion),
    followUpCount: !finished && isCareerFollowUpTurn(nextQuestion) ? 1 : 0,
    finished,
  });
};

const blobToBase64 = async (blob: Blob) => {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
};

export const interviewService = {
  answerInterviewQuestion: async (params: AnswerInterviewQuestionParams) => {
    const questionNumber = normalizeRequiredQuestionNumber(
      params.questionNumber,
    );
    const turnNo = Number(questionNumber);
    if (!Number.isFinite(turnNo)) {
      throw new AppError(
        ErrorCode.CLIENT_VALIDATION_ERROR,
        "questionNumber must be numeric on the main interview route",
      );
    }

    const answeredTurn = await submitCareerInterviewAnswer(params.sessionId, {
      turnNo,
      answer: params.answerContent,
      answerSource: "TEXT",
      answerSourceMeta: params.requestId
        ? {
            requestId: params.requestId,
          }
        : undefined,
    });
    const refreshedSession = await getCareerInterview(params.sessionId);
    return mapCareerTurnAnswer(answeredTurn, refreshedSession);
  },
  getNextQuestion: async (sessionId: string) => {
    const response = await getCareerInterviewNextQuestion(sessionId);
    return normalizeInterviewAnswer({
      isSuccess: true,
      questionNumber: toAnswerQuestionNumber(response.turnNo),
      questionContent: response.question ?? undefined,
      nextQuestion: response.question ?? null,
      nextQuestionNumber: toAnswerQuestionNumber(response.turnNo) ?? null,
      isFollowUp: isCareerFollowUpTurn(response),
      followUpCount: isCareerFollowUpTurn(response) ? 1 : 0,
      finished: !response.question?.trim(),
    });
  },
  getCurrentQuestion: async (sessionId: string) => {
    const response = await getCareerInterview(sessionId);
    return mapCareerSessionQuestion(response);
  },
  evaluateInterviewDemeanor: async (
    params: EvaluateInterviewDemeanorParams,
  ) => {
    const imageBase64 = await blobToBase64(params.userPhoto);

    return service.post<unknown, Record<string, unknown>>(
      `/career/interviews/${encodeURIComponent(params.sessionId)}/demeanor/analyze`,
      {
        consentGranted: true,
        imageBase64,
        sampledAt: new Date().toISOString(),
      },
    );
  },
  finishInterviewSession: async (sessionId: string) =>
    finishCareerInterview(sessionId),
};
