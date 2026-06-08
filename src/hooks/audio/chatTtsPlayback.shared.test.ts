import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPlanCareerInterviewTextToSpeech } = vi.hoisted(() => ({
  mockPlanCareerInterviewTextToSpeech: vi.fn(),
}));

vi.mock("@/services/careerService", () => ({
  planCareerInterviewTextToSpeech: mockPlanCareerInterviewTextToSpeech,
}));

import {
  isAbortError,
  normalizeBase64Audio,
  synthesizeChatMessageTts,
} from "@/hooks/audio/chatTtsPlayback.shared";

describe("chatTtsPlayback.shared", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes base64 audio payloads", () => {
    expect(normalizeBase64Audio(" data:audio/mpeg;base64,QUJDRA==\n ")).toBe(
      "QUJDRA==",
    );

    expect(normalizeBase64Audio("QUJD-RA__")).toBe("QUJD+RA//");
  });

  it("detects abort-style errors", () => {
    expect(isAbortError(new DOMException("aborted", "AbortError"))).toBe(true);
    expect(isAbortError(new Error("other"))).toBe(false);
  });

  it("uses HireSpark interview TTS planning on the /career interview chain", async () => {
    mockPlanCareerInterviewTextToSpeech.mockResolvedValue({
      enabled: true,
      completed: true,
      success: true,
      audioBase64: "QQ==",
      audioUrl: null,
    });

    const result = await synthesizeChatMessageTts(
      {
        text: "请介绍一下你的项目。",
        provider: "career-interview",
        sessionId: "session-1",
        turnId: "turn-2",
      },
      new AbortController().signal,
    );

    expect(mockPlanCareerInterviewTextToSpeech).toHaveBeenCalledWith(
      "session-1",
      {
        turnId: "turn-2",
        text: "请介绍一下你的项目。",
      },
    );
    expect(result.audioBase64).toBe("QQ==");
  });

  it("rejects non-interview chat playback because HireSpark does not expose a generic chat TTS endpoint", async () => {
    await expect(
      synthesizeChatMessageTts(
        {
          text: "Legacy playback",
        },
        new AbortController().signal,
      ),
    ).rejects.toThrow("Chat TTS is only available during interviews");

    expect(mockPlanCareerInterviewTextToSpeech).not.toHaveBeenCalled();
  });
});
