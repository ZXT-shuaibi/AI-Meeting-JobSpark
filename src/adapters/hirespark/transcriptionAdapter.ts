export interface HireSparkTranscriptionPacketDto {
  type?: string | null;
  text?: string | null;
  data?: string | null;
  isFinal?: boolean | null;
}

export interface HireSparkTranscriptionEvent {
  kind: "replace" | "archive" | "reset";
  text: string;
}

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const mapHireSparkTranscriptionPacket = (
  payload: HireSparkTranscriptionPacketDto,
): HireSparkTranscriptionEvent => {
  const type = normalizeString(payload.type).toLowerCase();
  const text = normalizeString(payload.text || payload.data);

  if (type === "start" || type === "transcription_started") {
    return {
      kind: "reset",
      text: "",
    };
  }

  if (payload.isFinal || type === "final") {
    return {
      kind: "archive",
      text,
    };
  }

  return {
    kind: "replace",
    text,
  };
};
