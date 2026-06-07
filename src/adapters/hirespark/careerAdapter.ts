type UnknownRecord = Record<string, unknown>;

export interface HireSparkCareerResumeUploadDto {
  documentId?: string | number | null;
  profileId?: string | number | null;
  resumeVersionId?: string | number | null;
  parseStatus?: string | null;
}

export interface CareerResumeUploadModel {
  documentId: string | null;
  profileId: string | null;
  resumeVersionId: string | null;
  status: string;
}

export interface HireSparkCareerOptimizationTaskDto {
  id?: string | number | null;
  status?: string | null;
  qualityScore?: number | string | null;
  suggestions?: unknown;
}

export interface CareerOptimizationTaskModel {
  id: string | null;
  status: string;
  qualityScore: number | null;
  suggestions: string[];
}

export interface HireSparkCareerInterviewSessionDto {
  id?: string | number | null;
  status?: string | null;
  currentTurnNo?: number | string | null;
  currentQuestion?: string | null;
}

export interface CareerInterviewSessionModel {
  id: string | null;
  status: string;
  currentTurnNo: number | null;
  currentQuestion: string | null;
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

const normalizeStatus = (value: unknown, fallback = "UNKNOWN") =>
  normalizeString(value) ?? fallback;

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized.length === 0) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeSuggestion = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    return (
      normalizeString(record.content) ??
      normalizeString(record.text) ??
      normalizeString(record.message) ??
      normalizeString(record.title)
    );
  }

  return null;
};

const normalizeSuggestions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeSuggestion(item))
    .filter((item): item is string => item !== null);
};

export const mapCareerResumeUpload = (
  payload: HireSparkCareerResumeUploadDto,
): CareerResumeUploadModel => ({
  documentId: normalizeString(payload.documentId),
  profileId: normalizeString(payload.profileId),
  resumeVersionId: normalizeString(payload.resumeVersionId),
  status: normalizeStatus(payload.parseStatus),
});

export const mapCareerOptimizationTask = (
  payload: HireSparkCareerOptimizationTaskDto,
): CareerOptimizationTaskModel => ({
  id: normalizeString(payload.id),
  status: normalizeStatus(payload.status),
  qualityScore: normalizeNumber(payload.qualityScore),
  suggestions: normalizeSuggestions(payload.suggestions),
});

export const mapCareerInterviewSession = (
  payload: HireSparkCareerInterviewSessionDto,
): CareerInterviewSessionModel => ({
  id: normalizeString(payload.id),
  status: normalizeStatus(payload.status),
  currentTurnNo: normalizeNumber(payload.currentTurnNo),
  currentQuestion: normalizeString(payload.currentQuestion),
});
