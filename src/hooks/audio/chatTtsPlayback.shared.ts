import { AppError, ErrorCode } from "@/lib/errors";
import type { ChatMessageTts } from "@/lib/chat";
import {
  planCareerInterviewTextToSpeech,
  type CareerInterviewTtsPlan,
} from "@/services/careerService";

export const INTERVIEW_QUESTION_TTS_REQUEST = Object.freeze({
  vcn: "x4_mingge",
  language: "zh",
  speed: 50,
  volume: 50,
  pitch: 50,
  rhy: 0,
  audioEncoding: "lame",
  sampleRate: 16000,
  timeoutSeconds: 90,
  pollIntervalMs: 1500,
});

export const isAbortError = (error: unknown) =>
  error instanceof AppError
    ? error.code === ErrorCode.ABORTED
    : error instanceof DOMException
      ? error.name === "AbortError"
      : error instanceof Error && error.name === "AbortError";

export const normalizeBase64Audio = (value: string) =>
  value
    .trim()
    .replace(/^data:audio\/[a-zA-Z0-9.+-]+;base64,/, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");

export type SynthesizedTtsTask = CareerInterviewTtsPlan;

export const synthesizeChatMessageTts = async (
  tts: ChatMessageTts | undefined,
  signal: AbortSignal,
): Promise<SynthesizedTtsTask> => {
  const text = tts?.text?.trim();
  if (!text) {
    throw new Error("TTS text is required");
  }

  const sessionId = tts?.sessionId?.trim();

  if (tts?.provider === "career-interview" && sessionId) {
    const plan = await planCareerInterviewTextToSpeech(sessionId, {
      turnId: tts.turnId?.trim() || undefined,
      text,
    });

    if (
      plan.enabled &&
      plan.completed &&
      plan.success &&
      (plan.audioBase64 || plan.audioUrl)
    ) {
      return plan;
    }

    throw new Error(
      plan.degradeReason ||
        plan.fallbackText ||
        "Career interview TTS is unavailable",
    );
  }

  void signal;
  throw new Error(
    "Chat TTS is only available during interviews in this phase.",
  );
};
