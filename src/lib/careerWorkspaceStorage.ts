export const CAREER_WORKSPACE_STORAGE_KEY = "career-workspace";
export const CAREER_INTERVIEW_BINDINGS_STORAGE_KEY =
  "career-interview-bindings";

export type CareerWorkspaceSnapshot = {
  profileId?: string | null;
  resumeVersionId?: string | null;
};

export type CareerInterviewSessionBinding = {
  profileId?: string | null;
  resumeVersionId?: string | null;
  jdId?: string | null;
  updatedAt?: number | null;
};

type CareerInterviewBindingsRecord = Record<
  string,
  CareerInterviewSessionBinding
>;

const isBrowser = () => typeof window !== "undefined";

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
};

const normalizeUpdatedAt = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
};

export const readCareerWorkspaceSnapshot = (): CareerWorkspaceSnapshot => {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(CAREER_WORKSPACE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as CareerWorkspaceSnapshot;
    return {
      profileId: normalizeString(parsed.profileId),
      resumeVersionId: normalizeString(parsed.resumeVersionId),
    };
  } catch {
    return {};
  }
};

export const writeCareerWorkspaceSnapshot = (
  snapshot: CareerWorkspaceSnapshot,
) => {
  if (!isBrowser()) {
    return;
  }

  const current = readCareerWorkspaceSnapshot();
  const nextSnapshot: CareerWorkspaceSnapshot = {
    profileId: normalizeString(snapshot.profileId) ?? current.profileId ?? null,
    resumeVersionId:
      normalizeString(snapshot.resumeVersionId) ??
      current.resumeVersionId ??
      null,
  };

  window.localStorage.setItem(
    CAREER_WORKSPACE_STORAGE_KEY,
    JSON.stringify(nextSnapshot),
  );
};

const normalizeCareerInterviewSessionBinding = (
  value: unknown,
): CareerInterviewSessionBinding => {
  const record =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as CareerInterviewSessionBinding)
      : {};

  return {
    profileId: normalizeString(record.profileId),
    resumeVersionId: normalizeString(record.resumeVersionId),
    jdId: normalizeString(record.jdId),
    updatedAt: normalizeUpdatedAt(record.updatedAt),
  };
};

const readCareerInterviewBindingsRecord = (): CareerInterviewBindingsRecord => {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(
      CAREER_INTERVIEW_BINDINGS_STORAGE_KEY,
    );
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed).map(([sessionId, binding]) => [
        sessionId,
        normalizeCareerInterviewSessionBinding(binding),
      ]),
    );
  } catch {
    return {};
  }
};

export const readCareerInterviewSessionBinding = (
  sessionId: string | null | undefined,
): CareerInterviewSessionBinding | null => {
  const normalizedSessionId = normalizeString(sessionId);
  if (!normalizedSessionId) {
    return null;
  }

  const bindings = readCareerInterviewBindingsRecord();
  const binding = bindings[normalizedSessionId];
  if (!binding) {
    return null;
  }

  return normalizeCareerInterviewSessionBinding(binding);
};

export const writeCareerInterviewSessionBinding = (
  sessionId: string,
  binding: CareerInterviewSessionBinding,
) => {
  if (!isBrowser()) {
    return;
  }

  const normalizedSessionId = normalizeString(sessionId);
  if (!normalizedSessionId) {
    return;
  }

  const current = readCareerInterviewBindingsRecord();
  const previous = current[normalizedSessionId] || {};
  const nextBinding: CareerInterviewSessionBinding = {
    profileId: normalizeString(binding.profileId) ?? previous.profileId ?? null,
    resumeVersionId:
      normalizeString(binding.resumeVersionId) ??
      previous.resumeVersionId ??
      null,
    jdId: normalizeString(binding.jdId) ?? previous.jdId ?? null,
    updatedAt: Date.now(),
  };

  current[normalizedSessionId] = nextBinding;

  window.localStorage.setItem(
    CAREER_INTERVIEW_BINDINGS_STORAGE_KEY,
    JSON.stringify(current),
  );
};
