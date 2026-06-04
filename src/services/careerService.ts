import {
  mapCareerOptimizationTask,
  mapCareerResumeUpload,
  type CareerOptimizationTaskModel,
  type CareerResumeUploadModel,
  type HireSparkCareerOptimizationTaskDto,
  type HireSparkCareerResumeUploadDto,
} from "@/adapters/hirespark/careerAdapter";
import { getAuthToken } from "@/lib/authToken";
import service, { buildApiUrl } from "@/lib/request";

type UnknownRecord = Record<string, unknown>;

export interface CareerResumeVersion {
  id: string;
  profileId: string | null;
  versionNo: number | null;
  title: string | null;
  content: string | null;
  markdownContent: string | null;
  createTime: string | null;
}

export interface CareerJob {
  id: string;
  title: string | null;
  company: string | null;
  rawText: string | null;
  createTime: string | null;
}

export interface CareerProgressEvent {
  id?: string;
  eventType?: string | null;
  message?: string | null;
  payloadJson?: string | null;
  createTime?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  payload?: unknown;
}

export interface CareerOptimizationTask extends CareerOptimizationTaskModel {
  resumeVersionId?: string | null;
  jdId?: string | null;
  summary?: string | null;
  reviewStatus?: string | null;
  riskSummary?: string | null;
  progressEvents?: CareerProgressEvent[];
  traceId?: string | null;
}

export interface CareerInterviewTurn {
  id?: string | null;
  sessionId?: string | null;
  turnNo?: number | null;
  turnType?: string | null;
  question?: string | null;
  answer?: string | null;
  answerSource?: string | null;
  answerSourceMeta?: UnknownRecord | null;
  score?: number | null;
  feedback?: UnknownRecord | null;
  status?: string | null;
  stepIdempotencyKey?: string | null;
  answerStatus?: string | null;
  evaluationStatus?: string | null;
  followUpDecisionStatus?: string | null;
  compensationStatus?: string | null;
  attemptCount?: number | null;
  lastError?: string | null;
}

export interface CareerInterviewSession {
  id: string;
  status: string | null;
  plan: UnknownRecord | null;
  currentTurnNo: number | null;
  currentQuestion: CareerInterviewTurn | null;
}

export interface CareerInterviewReport {
  id: string;
  sessionId: string;
  overallScore: number | null;
  radar: unknown[];
  playback: unknown[];
  suggestions: unknown[];
  summary: string | null;
  traceId: string | null;
  createTime: string | null;
}

export interface CareerProgressStreamHandlers {
  onConnected?: (payload: unknown) => void;
  onProgress?: (event: CareerProgressEvent) => void;
  onDone?: (event?: CareerProgressEvent) => void;
  onError?: (error: Error) => void;
}

export interface CreateCareerOptimizationPayload {
  resumeVersionId?: string;
  jdId?: string;
  alignmentReportId?: string;
}

export interface CreateCareerJobPayload {
  title?: string;
  company?: string;
  rawText?: string;
  sourceType?: string;
  sourceLocation?: string;
}

export interface SubmitCareerInterviewAnswerPayload {
  turnNo?: number;
  answer?: string;
  answerRevision?: string;
  answerSource?: string;
  answerSourceMeta?: UnknownRecord;
}

export interface CareerProgressStreamHandle {
  close: () => void;
}

const normalizeString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
};

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};

const toRecordOrNull = (value: unknown): UnknownRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const toArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : value == null ? [] : [value];

const parseProgressData = (raw: string): unknown => {
  if (!raw) {
    return "";
  }
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

const normalizeProgressEvent = (payload: unknown): CareerProgressEvent => {
  const record = toRecord(payload);
  return {
    id: normalizeString(record.id) ?? undefined,
    eventType:
      normalizeString(record.eventType) ??
      normalizeString(record.event_type) ??
      null,
    message: normalizeString(record.message) ?? null,
    payloadJson:
      normalizeString(record.payloadJson) ??
      normalizeString(record.payload_json) ??
      null,
    createTime:
      normalizeString(record.createTime) ??
      normalizeString(record.create_time) ??
      null,
    sessionId:
      normalizeString(record.sessionId) ??
      normalizeString(record.session_id) ??
      null,
    userId:
      normalizeString(record.userId) ?? normalizeString(record.user_id) ?? null,
    payload: record.payload,
  };
};

const normalizeResumeVersion = (payload: unknown): CareerResumeVersion => {
  const record = toRecord(payload);
  return {
    id:
      normalizeString(record.id) ??
      normalizeString(record.resumeVersionId) ??
      "",
    profileId:
      normalizeString(record.profileId) ??
      normalizeString(record.profile_id) ??
      null,
    versionNo:
      normalizeNumber(record.versionNo) ??
      normalizeNumber(record.version_no) ??
      null,
    title: normalizeString(record.title) ?? null,
    content: normalizeString(record.content) ?? null,
    markdownContent:
      normalizeString(record.markdownContent) ??
      normalizeString(record.markdown_content) ??
      null,
    createTime:
      normalizeString(record.createTime) ??
      normalizeString(record.create_time) ??
      null,
  };
};

const normalizeJob = (payload: unknown): CareerJob => {
  const record = toRecord(payload);
  return {
    id: normalizeString(record.id) ?? "",
    title: normalizeString(record.title) ?? null,
    company: normalizeString(record.company) ?? null,
    rawText:
      normalizeString(record.rawText) ??
      normalizeString(record.raw_text) ??
      null,
    createTime:
      normalizeString(record.createTime) ??
      normalizeString(record.create_time) ??
      null,
  };
};

const normalizeInterviewTurn = (payload: unknown): CareerInterviewTurn => {
  const record = toRecord(payload);
  return {
    id: normalizeString(record.id),
    sessionId:
      normalizeString(record.sessionId) ??
      normalizeString(record.session_id) ??
      null,
    turnNo:
      normalizeNumber(record.turnNo) ?? normalizeNumber(record.turn_no) ?? null,
    turnType:
      normalizeString(record.turnType) ??
      normalizeString(record.turn_type) ??
      null,
    question: normalizeString(record.question) ?? null,
    answer: normalizeString(record.answer) ?? null,
    answerSource:
      normalizeString(record.answerSource) ??
      normalizeString(record.answer_source) ??
      null,
    answerSourceMeta:
      toRecordOrNull(record.answerSourceMeta ?? record.answer_source_meta) ??
      null,
    score: normalizeNumber(record.score) ?? null,
    feedback: toRecordOrNull(record.feedback) ?? null,
    status: normalizeString(record.status) ?? null,
    stepIdempotencyKey:
      normalizeString(record.stepIdempotencyKey) ??
      normalizeString(record.step_idempotency_key) ??
      null,
    answerStatus:
      normalizeString(record.answerStatus) ??
      normalizeString(record.answer_status) ??
      null,
    evaluationStatus:
      normalizeString(record.evaluationStatus) ??
      normalizeString(record.evaluation_status) ??
      null,
    followUpDecisionStatus:
      normalizeString(record.followUpDecisionStatus) ??
      normalizeString(record.follow_up_decision_status) ??
      null,
    compensationStatus:
      normalizeString(record.compensationStatus) ??
      normalizeString(record.compensation_status) ??
      null,
    attemptCount:
      normalizeNumber(record.attemptCount) ??
      normalizeNumber(record.attempt_count) ??
      null,
    lastError:
      normalizeString(record.lastError) ??
      normalizeString(record.last_error) ??
      null,
  };
};

const normalizeInterviewSession = (
  payload: unknown,
): CareerInterviewSession => {
  const record = toRecord(payload);
  return {
    id: normalizeString(record.id) ?? "",
    status: normalizeString(record.status) ?? null,
    plan: toRecordOrNull(record.plan) ?? null,
    currentTurnNo:
      normalizeNumber(record.currentTurnNo) ??
      normalizeNumber(record.current_turn_no) ??
      null,
    currentQuestion: record.currentQuestion
      ? normalizeInterviewTurn(record.currentQuestion)
      : null,
  };
};

const normalizeInterviewReport = (payload: unknown): CareerInterviewReport => {
  const record = toRecord(payload);
  return {
    id: normalizeString(record.id) ?? "",
    sessionId:
      normalizeString(record.sessionId) ??
      normalizeString(record.session_id) ??
      "",
    overallScore:
      normalizeNumber(record.overallScore) ??
      normalizeNumber(record.overall_score) ??
      null,
    radar: toArray(record.radar),
    playback: toArray(record.playback),
    suggestions: toArray(record.suggestions),
    summary: normalizeString(record.summary) ?? null,
    traceId:
      normalizeString(record.traceId) ??
      normalizeString(record.trace_id) ??
      null,
    createTime:
      normalizeString(record.createTime) ??
      normalizeString(record.create_time) ??
      null,
  };
};

const normalizeOptimizationTask = (
  payload: HireSparkCareerOptimizationTaskDto & UnknownRecord,
): CareerOptimizationTask => {
  const mapped = mapCareerOptimizationTask(payload);
  return {
    ...mapped,
    resumeVersionId:
      normalizeString(payload.resumeVersionId) ??
      normalizeString(payload.resume_version_id) ??
      null,
    jdId:
      normalizeString(payload.jdId) ?? normalizeString(payload.jd_id) ?? null,
    summary: normalizeString(payload.summary) ?? null,
    reviewStatus:
      normalizeString(payload.reviewStatus) ??
      normalizeString(payload.review_status) ??
      null,
    riskSummary:
      normalizeString(payload.riskSummary) ??
      normalizeString(payload.risk_summary) ??
      null,
    progressEvents: Array.isArray(payload.progressEvents)
      ? payload.progressEvents.map((item) => normalizeProgressEvent(item))
      : [],
    traceId:
      normalizeString(payload.traceId) ??
      normalizeString(payload.trace_id) ??
      null,
  };
};

async function readProgressStream(
  response: Response,
  handlers: CareerProgressStreamHandlers,
  signal: AbortSignal,
) {
  if (!response.body) {
    throw new Error("Progress stream body is empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];

  const dispatchEvent = () => {
    if (dataLines.length === 0) {
      eventName = "message";
      return;
    }

    const payload = parseProgressData(dataLines.join("\n"));
    if (eventName === "connected") {
      handlers.onConnected?.(payload);
    } else if (eventName === "progress") {
      handlers.onProgress?.(normalizeProgressEvent(payload));
    } else if (eventName === "done") {
      handlers.onDone?.(normalizeProgressEvent(payload));
    } else if (eventName === "error") {
      const message =
        normalizeString((payload as UnknownRecord)?.error) ||
        normalizeString(payload) ||
        "Progress stream failed";
      handlers.onError?.(new Error(message));
    }

    eventName = "message";
    dataLines = [];
  };

  const consumeLine = (line: string) => {
    if (!line) {
      dispatchEvent();
      return;
    }
    if (line.startsWith(":")) {
      return;
    }
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      return;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  };

  while (true) {
    if (signal.aborted) {
      await reader.cancel();
      return;
    }

    const { value, done } = await reader.read();
    if (done) {
      if (buffer) {
        for (const line of buffer.split(/\r?\n/u)) {
          consumeLine(line);
        }
        buffer = "";
      }
      dispatchEvent();
      return;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/u);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      consumeLine(line);
    }
  }
}

const createProgressStream = async (
  path: string,
  handlers: CareerProgressStreamHandlers,
): Promise<CareerProgressStreamHandle> => {
  const controller = new AbortController();
  const token = getAuthToken();
  const url = buildApiUrl(path);

  void fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Progress stream request failed with ${response.status}`,
        );
      }
      return readProgressStream(response, handlers, controller.signal);
    })
    .catch((error: unknown) => {
      if ((error as Error)?.name === "AbortError") {
        return;
      }
      handlers.onError?.(
        error instanceof Error ? error : new Error("Progress stream failed"),
      );
    });

  return {
    close: () => controller.abort(),
  };
};

const buildWebSocketOrigin = () => {
  const apiRoot = buildApiUrl("/");
  const resolved =
    typeof window === "undefined"
      ? new URL(apiRoot)
      : new URL(apiRoot, window.location.origin);
  resolved.protocol = resolved.protocol === "https:" ? "wss:" : "ws:";
  return resolved;
};

export const uploadCareerResume = async (
  file: File,
): Promise<CareerResumeUploadModel> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await service.post<HireSparkCareerResumeUploadDto>(
    "/career/resumes/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return mapCareerResumeUpload(response);
};

export const getCareerResumeVersion = async (
  versionId: string,
): Promise<CareerResumeVersion> => {
  const response = await service.get<UnknownRecord>(
    `/career/resumes/versions/${encodeURIComponent(versionId)}`,
  );
  return normalizeResumeVersion(response);
};

export const createCareerJob = async (
  payload: CreateCareerJobPayload,
): Promise<CareerJob> => {
  const response = await service.post<UnknownRecord>("/career/jobs", payload);
  return normalizeJob(response);
};

export const createCareerOptimization = async (
  payload: CreateCareerOptimizationPayload,
): Promise<CareerOptimizationTask> => {
  const response = await service.post<HireSparkCareerOptimizationTaskDto>(
    "/career/optimizations",
    payload,
  );
  return normalizeOptimizationTask(toRecord(response));
};

export const getCareerOptimizationTask = async (
  taskId: string,
): Promise<CareerOptimizationTask> => {
  const response = await service.get<HireSparkCareerOptimizationTaskDto>(
    `/career/optimizations/${encodeURIComponent(taskId)}`,
  );
  return normalizeOptimizationTask(toRecord(response));
};

export const createCareerOptimizationProgressStream = async (
  taskId: string,
  handlers: CareerProgressStreamHandlers,
): Promise<CareerProgressStreamHandle> =>
  createProgressStream(
    `/career/optimizations/${encodeURIComponent(taskId)}/progress/stream`,
    handlers,
  );

export const createCareerInterview = async (
  resumeVersionId: string,
  jdId: string,
): Promise<CareerInterviewSession> => {
  const response = await service.post<UnknownRecord>("/career/interviews", {
    resumeVersionId,
    jdId,
  });
  return normalizeInterviewSession(response);
};

export const getCareerInterview = async (
  sessionId: string,
): Promise<CareerInterviewSession> => {
  const response = await service.get<UnknownRecord>(
    `/career/interviews/${encodeURIComponent(sessionId)}`,
  );
  return normalizeInterviewSession(response);
};

export const getCareerInterviewNextQuestion = async (
  sessionId: string,
): Promise<CareerInterviewTurn> => {
  const response = await service.get<UnknownRecord>(
    `/career/interviews/${encodeURIComponent(sessionId)}/next-question`,
  );
  return normalizeInterviewTurn(response);
};

export const submitCareerInterviewAnswer = async (
  sessionId: string,
  payload: SubmitCareerInterviewAnswerPayload,
): Promise<CareerInterviewTurn> => {
  const response = await service.post<UnknownRecord>(
    `/career/interviews/${encodeURIComponent(sessionId)}/answers`,
    payload,
  );
  return normalizeInterviewTurn(response);
};

export const finishCareerInterview = async (sessionId: string) => {
  await service.post<void>(
    `/career/interviews/${encodeURIComponent(sessionId)}/finish`,
    {},
  );
};

export const generateCareerInterviewReport = async (
  sessionId: string,
): Promise<CareerInterviewReport> => {
  const response = await service.post<UnknownRecord>(
    `/career/interviews/${encodeURIComponent(sessionId)}/report`,
    {},
  );
  return normalizeInterviewReport(response);
};

export const getCareerInterviewReport = async (
  sessionId: string,
): Promise<CareerInterviewReport> => {
  const response = await service.get<UnknownRecord>(
    `/career/interviews/${encodeURIComponent(sessionId)}/report`,
  );
  return normalizeInterviewReport(response);
};

export const createCareerInterviewProgressStream = async (
  sessionId: string,
  handlers: CareerProgressStreamHandlers,
): Promise<CareerProgressStreamHandle> =>
  createProgressStream(
    `/career/interviews/${encodeURIComponent(sessionId)}/progress/stream`,
    handlers,
  );

export const createCareerInterviewTranscriptionUrl = (
  sessionId: string,
): string => {
  const token = getAuthToken();
  const wsBase = buildWebSocketOrigin();
  const basePath = wsBase.pathname.replace(/\/$/, "");
  const url = new URL(
    `${basePath}/career/interviews/${encodeURIComponent(sessionId)}/transcription/ws`,
    wsBase.origin,
  );
  if (token) {
    url.searchParams.set("Authorization", token);
  }
  return url.toString();
};
