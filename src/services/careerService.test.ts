import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetAuthToken, mockBuildApiUrl } = vi.hoisted(() => ({
  mockGetAuthToken: vi.fn(),
  mockBuildApiUrl: vi.fn(),
}));

vi.mock("@/lib/authToken", () => ({
  getAuthToken: mockGetAuthToken,
}));

vi.mock("@/lib/request", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  buildApiUrl: mockBuildApiUrl,
}));

import {
  createCareerInterviewProgressStream,
  createCareerInterviewTranscriptionUrl,
  createCareerOptimizationProgressStream,
} from "./careerService";

describe("careerService progress stream", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockGetAuthToken.mockReset();
    mockBuildApiUrl.mockReset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("uses Bearer auth when subscribing to the optimization progress stream", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(() => {
          return;
        }),
    );
    global.fetch = fetchMock as typeof fetch;
    mockGetAuthToken.mockReturnValue("token-123");
    mockBuildApiUrl.mockReturnValue(
      "http://localhost:8080/career/optimizations/task-1/progress/stream",
    );

    await createCareerOptimizationProgressStream("task-1", {});

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/career/optimizations/task-1/progress/stream",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "text/event-stream",
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });

  it("dispatches the final SSE event even when the stream ends without a trailing blank line", async () => {
    const doneHandler = vi.fn();
    const encoder = new TextEncoder();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode('event: done\ndata: {"message":"浼樺寲瀹屾垚"}'),
          );
          controller.close();
        },
      }),
    } as Response);
    mockGetAuthToken.mockReturnValue("token-123");
    mockBuildApiUrl.mockReturnValue(
      "http://localhost:8080/career/optimizations/task-2/progress/stream",
    );

    await createCareerOptimizationProgressStream("task-2", {
      onDone: doneHandler,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(doneHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "浼樺寲瀹屾垚",
      }),
    );
  });

  it("uses Bearer auth when subscribing to the interview progress stream", async () => {
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(() => {
          return;
        }),
    );
    global.fetch = fetchMock as typeof fetch;
    mockGetAuthToken.mockReturnValue("token-456");
    mockBuildApiUrl.mockReturnValue(
      "http://localhost:8080/career/interviews/session-1/progress/stream",
    );

    await createCareerInterviewProgressStream("session-1", {});

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/career/interviews/session-1/progress/stream",
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "text/event-stream",
          Authorization: "Bearer token-456",
        }),
      }),
    );
  });

  it("builds the HireSpark interview transcription url with the session id and token query", () => {
    mockGetAuthToken.mockReturnValue("token-789");
    mockBuildApiUrl.mockReturnValue("http://localhost:8080");

    expect(createCareerInterviewTranscriptionUrl("session-2")).toBe(
      "ws://localhost:8080/career/interviews/session-2/transcription/ws?Authorization=token-789",
    );
  });
});
