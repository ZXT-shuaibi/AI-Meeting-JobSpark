import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetAuthToken,
  mockResolveApiBaseUrl,
  mockResolveRuntimeWsBaseUrl,
  mockResolveWsBaseUrl,
  mockCreateCareerInterviewTranscriptionUrl,
} = vi.hoisted(() => ({
  mockGetAuthToken: vi.fn(() => "token"),
  mockResolveApiBaseUrl: vi.fn(() => "/api"),
  mockResolveRuntimeWsBaseUrl: vi.fn(() => "ws://localhost:8080"),
  mockResolveWsBaseUrl: vi.fn(() => "ws://localhost:8080"),
  mockCreateCareerInterviewTranscriptionUrl: vi.fn(
    () =>
      "ws://localhost:8080/career/interviews/session-1/transcription/ws?Authorization=token",
  ),
}));

vi.mock("@/lib/authToken", () => ({
  getAuthToken: mockGetAuthToken,
}));

vi.mock("@/config/env", () => ({
  resolveApiBaseUrl: mockResolveApiBaseUrl,
  resolveRuntimeWsBaseUrl: mockResolveRuntimeWsBaseUrl,
  resolveWsBaseUrl: mockResolveWsBaseUrl,
}));

vi.mock("@/services/careerService", () => ({
  createCareerInterviewTranscriptionUrl:
    mockCreateCareerInterviewTranscriptionUrl,
}));

import { AudioToTextWebSocket } from "@/services/audioToTextWs";

describe("AudioToTextWebSocket message handling", () => {
  let instance: AudioToTextWebSocket;

  beforeEach(() => {
    instance = new AudioToTextWebSocket("tester");
  });

  it("ignores out-of-order transcription packets", () => {
    const onTranscription = vi.fn();
    instance.onTranscription = onTranscription;

    (
      instance as unknown as {
        handleMessage: (message: Record<string, unknown>) => void;
      }
    ).handleMessage({
      type: "transcription",
      data: "最新快照",
      timestamp: 20,
    });
    (
      instance as unknown as {
        handleMessage: (message: Record<string, unknown>) => void;
      }
    ).handleMessage({
      type: "transcription",
      data: "旧快照",
      timestamp: 10,
    });

    expect(onTranscription).toHaveBeenCalledTimes(1);
    expect(onTranscription).toHaveBeenCalledWith("最新快照");
  });

  it("deduplicates identical packets with the same timestamp", () => {
    const onTranscription = vi.fn();
    instance.onTranscription = onTranscription;

    const message = {
      type: "transcription",
      data: "重复快照",
      timestamp: 30,
    };
    (
      instance as unknown as {
        handleMessage: (incoming: typeof message) => void;
      }
    ).handleMessage(message);
    (
      instance as unknown as {
        handleMessage: (incoming: typeof message) => void;
      }
    ).handleMessage(message);

    expect(onTranscription).toHaveBeenCalledTimes(1);
  });

  it("clears the current snapshot when the server starts a new transcription session", () => {
    const onTranscription = vi.fn();
    instance.onTranscription = onTranscription;

    (
      instance as unknown as {
        handleMessage: (message: Record<string, unknown>) => void;
      }
    ).handleMessage({
      type: "transcription_started",
      timestamp: 40,
    });

    expect(onTranscription).toHaveBeenCalledWith("");
  });

  it("maps HireSpark interview transcription snapshots on the main chain", () => {
    const careerInstance = new AudioToTextWebSocket({
      mode: "career-interview",
      interviewSessionId: "session-1",
    });
    const onTranscription = vi.fn();
    const onFinal = vi.fn();
    careerInstance.onTranscription = onTranscription;
    careerInstance.onFinal = onFinal;

    (
      careerInstance as unknown as {
        handleMessage: (message: Record<string, unknown>) => void;
      }
    ).handleMessage({
      type: "transcription_started",
      timestamp: 1,
    });
    (
      careerInstance as unknown as {
        handleMessage: (message: Record<string, unknown>) => void;
      }
    ).handleMessage({
      type: "transcription",
      fullText: "第一段回答",
      updateAction: "replace",
      timestamp: 2,
    });
    (
      careerInstance as unknown as {
        handleMessage: (message: Record<string, unknown>) => void;
      }
    ).handleMessage({
      type: "final",
      fullText: "完整回答",
      isFinalPacket: true,
      updateAction: "archive",
      timestamp: 3,
    });

    expect(mockCreateCareerInterviewTranscriptionUrl).toHaveBeenCalledWith(
      "session-1",
    );
    expect(onTranscription).toHaveBeenCalledWith("");
    expect(onTranscription).toHaveBeenCalledWith("第一段回答");
    expect(onFinal).toHaveBeenCalledWith("完整回答");
  });
});
