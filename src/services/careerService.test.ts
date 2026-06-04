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

import { createCareerOptimizationProgressStream } from "./careerService";

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
            encoder.encode('event: done\ndata: {"message":"优化完成"}'),
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
        message: "优化完成",
      }),
    );
  });
});
