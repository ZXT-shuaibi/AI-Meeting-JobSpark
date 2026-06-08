import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockServiceGet,
  mockServicePost,
  mockAssertRequestAuthorized,
  mockBuildApiUrl,
  mockFetchEventSource,
} = vi.hoisted(() => ({
  mockServiceGet: vi.fn(),
  mockServicePost: vi.fn(),
  mockAssertRequestAuthorized: vi.fn(),
  mockBuildApiUrl: vi.fn(),
  mockFetchEventSource: vi.fn(),
}));

vi.mock("@/lib/request", () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockServiceGet(...args),
    post: (...args: unknown[]) => mockServicePost(...args),
  },
  assertRequestAuthorized: (...args: unknown[]) =>
    mockAssertRequestAuthorized(...args),
  buildApiUrl: (...args: unknown[]) => mockBuildApiUrl(...args),
}));

vi.mock("@microsoft/fetch-event-source", () => ({
  fetchEventSource: (...args: unknown[]) => mockFetchEventSource(...args),
}));

import { aiService } from "@/services/aiService";

describe("aiService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertRequestAuthorized.mockReturnValue("token-value");
    mockBuildApiUrl.mockImplementation(
      (
        path: string,
        query?: Record<string, string | number | boolean | null | undefined>,
      ) => {
        const searchParams = new URLSearchParams();
        Object.entries(query ?? {}).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") {
            return;
          }
          searchParams.set(key, String(value));
        });
        const queryString = searchParams.toString();
        return queryString ? `${path}?${queryString}` : path;
      },
    );
  });

  it("maps HireSpark rag settings into selectable AI models", async () => {
    mockServiceGet.mockResolvedValue({
      ai: {
        chat: {
          defaultModel: "deepseek-chat",
          deepThinkingModel: "deepseek-reasoner",
          candidates: [
            {
              id: "deepseek-chat",
              provider: "deepseek",
              model: "deepseek-chat",
              enabled: true,
              supportsThinking: false,
            },
            {
              id: "deepseek-reasoner",
              provider: "deepseek",
              model: "deepseek-reasoner",
              enabled: true,
              supportsThinking: true,
            },
          ],
        },
      },
    });

    const result = await aiService.getAiProperties();

    expect(mockServiceGet).toHaveBeenCalledWith("/rag/settings");
    expect(result.records).toHaveLength(2);
    expect(result.records[0]).toMatchObject({
      aiName: "deepseek-chat",
      aiType: "deepseek",
      modelName: "deepseek-chat",
      enableThinking: 0,
      isEnabled: 1,
    });
    expect(result.records[1]).toMatchObject({
      aiName: "deepseek-reasoner",
      aiType: "deepseek",
      modelName: "deepseek-reasoner",
      enableThinking: 1,
      isEnabled: 1,
    });
  });

  it("maps HireSpark conversation list into the legacy page shape expected by the sidebar", async () => {
    mockServiceGet.mockResolvedValue([
      {
        conversationId: "conv-1",
        title: "Mock Interview Prep",
        lastTime: "2026-06-08T10:00:00.000Z",
      },
      {
        conversationId: "conv-2",
        title: "Resume Notes",
        lastTime: "2026-06-07T09:00:00.000Z",
      },
    ]);

    const result = await aiService.getConversations({
      current: 1,
      size: 20,
    });

    expect(mockServiceGet).toHaveBeenCalledWith("/conversations");
    expect(result).toMatchObject({
      total: 2,
      size: 20,
      current: 1,
      pages: 1,
    });
    expect(result.records[0]).toMatchObject({
      sessionId: "conv-1",
      title: "Mock Interview Prep",
      aiName: "HireSpark RAG",
      createTime: "2026-06-08T10:00:00.000Z",
      lastMessageTime: "2026-06-08T10:00:00.000Z",
    });
  });

  it("maps HireSpark conversation messages into chat history records", async () => {
    mockServiceGet.mockResolvedValue([
      {
        id: "msg-1",
        conversationId: "conv-1",
        role: "user",
        content: "Tell me about the project.",
        createTime: "2026-06-08T10:00:01.000Z",
      },
      {
        id: "msg-2",
        conversationId: "conv-1",
        role: "assistant",
        content: "It was a migration from monolith to services.",
        thinkingContent: "先整理关键节点",
        createTime: "2026-06-08T10:00:02.000Z",
      },
    ]);

    const result = await aiService.getConversationHistory("conv-1");

    expect(mockServiceGet).toHaveBeenCalledWith(
      "/conversations/conv-1/messages",
      undefined,
    );
    expect(result).toEqual([
      expect.objectContaining({
        id: "msg-1",
        sessionId: "conv-1",
        messageType: 1,
        messageContent: "Tell me about the project.",
      }),
      expect.objectContaining({
        id: "msg-2",
        sessionId: "conv-1",
        messageType: 2,
        messageContent: "It was a migration from monolith to services.",
        reasoningContent: "先整理关键节点",
      }),
    ]);
  });

  it("streams through HireSpark rag SSE and emits meta, reasoning, content and finish callbacks", async () => {
    mockFetchEventSource.mockImplementation(
      async (
        _url: string,
        options: {
          onmessage: (event: { event: string; data: string }) => void;
          onclose?: () => void;
        },
      ) => {
        options.onmessage({
          event: "meta",
          data: JSON.stringify({
            conversationId: "conv-9",
            taskId: "task-9",
          }),
        });
        options.onmessage({
          event: "message",
          data: JSON.stringify({
            type: "think",
            delta: "先分析问题",
          }),
        });
        options.onmessage({
          event: "message",
          data: JSON.stringify({
            type: "response",
            delta: "这是最终回答",
          }),
        });
        options.onmessage({
          event: "finish",
          data: JSON.stringify({
            messageId: "msg-9",
            title: "新对话",
          }),
        });
        options.onmessage({
          event: "done",
          data: "[DONE]",
        });
        options.onclose?.();
      },
    );

    const onMeta = vi.fn();
    const onReasoning = vi.fn();
    const onMessage = vi.fn();
    const onFinish = vi.fn();
    const onDone = vi.fn();

    await aiService.streamChat(
      {
        sessionId: "",
        inputMessage: "How should I optimize my resume?",
        userName: "tester",
        aiId: 2,
      },
      new AbortController().signal,
      {
        onMeta,
        onReasoning,
        onMessage,
        onFinish,
        onDone,
      },
    );

    expect(mockBuildApiUrl).toHaveBeenCalledWith("/rag/v3/chat", {
      question: "How should I optimize my resume?",
      deepThinking: true,
    });
    expect(mockFetchEventSource).toHaveBeenCalledWith(
      "/rag/v3/chat?question=How+should+I+optimize+my+resume%3F&deepThinking=true",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-value",
        }),
      }),
    );
    expect(onMeta).toHaveBeenCalledWith({
      conversationId: "conv-9",
      taskId: "task-9",
    });
    expect(onReasoning).toHaveBeenCalledWith("先分析问题");
    expect(onMessage).toHaveBeenCalledWith("这是最终回答");
    expect(onFinish).toHaveBeenCalledWith({
      messageId: "msg-9",
      title: "新对话",
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("stops the active HireSpark rag task when the stream is aborted after meta arrives", async () => {
    const controller = new AbortController();

    mockFetchEventSource.mockImplementation(
      async (
        _url: string,
        options: {
          onmessage: (event: { event: string; data: string }) => void;
        },
      ) => {
        options.onmessage({
          event: "meta",
          data: JSON.stringify({
            conversationId: "conv-stop",
            taskId: "task-stop",
          }),
        });
        controller.abort();
      },
    );

    await aiService.streamChat(
      {
        sessionId: "conv-stop",
        inputMessage: "stop me",
        userName: "tester",
      },
      controller.signal,
      {
        onMessage: vi.fn(),
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockServicePost).toHaveBeenCalledWith("/rag/v3/stop", undefined, {
      params: {
        taskId: "task-stop",
      },
    });
  });
});
