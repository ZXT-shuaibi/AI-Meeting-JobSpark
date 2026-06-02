type UnknownRecord = Record<string, unknown>;

export interface HireSparkStreamEventDto {
  event?: string | null;
  type?: string | null;
  data?: unknown;
  done?: boolean | null;
}

export interface HireSparkStreamEvent {
  event: string;
  text: string | null;
  done: boolean;
  payload: unknown;
}

const normalizeString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  return null;
};

const normalizeBoolean = (value: unknown): boolean => value === true;

const extractText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (value && typeof value === "object") {
    const record = value as UnknownRecord;
    return (
      normalizeString(record.text) ??
      normalizeString(record.content) ??
      normalizeString(record.message)
    );
  }

  return null;
};

export const mapHireSparkStreamEvent = (
  payload: HireSparkStreamEventDto,
): HireSparkStreamEvent => ({
  event:
    normalizeString(payload.event) ??
    normalizeString(payload.type) ??
    "message",
  text: extractText(payload.data),
  done: normalizeBoolean(payload.done),
  payload: payload.data ?? null,
});
