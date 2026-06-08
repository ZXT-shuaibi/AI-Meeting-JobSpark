import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/constants";
import { useChatPageController } from "@/hooks/chat/useChatPageController";
import chatReducer, {
  initialState as initialChatState,
} from "@/store/slices/chatSlice";
import userReducer from "@/store/slices/userSlice";
import type { ChatMessage } from "@/lib/chat";

const navigateMock = vi.fn();
const useLocationMock = vi.fn();
const useParamsMock = vi.fn();
const getConversationHistoryMock = vi.fn();
const streamChatMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => useLocationMock(),
    useParams: () => useParamsMock(),
  };
});

vi.mock("@/hooks/useAiModelsQuery", () => ({
  useAiModelsQuery: () => ({
    models: [
      {
        id: 101,
        aiName: "GPT Test",
      },
    ],
  }),
}));

vi.mock("@/services/aiService", () => ({
  aiService: {
    getConversationHistory: (...args: unknown[]) =>
      getConversationHistoryMock(...args),
    streamChat: (...args: unknown[]) => streamChatMock(...args),
  },
}));

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const createStore = (chatState: Partial<typeof initialChatState> = {}) =>
  configureStore({
    reducer: {
      user: userReducer,
      chat: chatReducer,
    },
    preloadedState: {
      user: {
        currentUser: {
          id: 1,
          username: "tester",
        },
        isAuthenticated: true,
        loading: false,
        error: null,
        authEpoch: 1,
      },
      chat: {
        ...initialChatState,
        ...chatState,
      },
    },
  });

const renderChatController = (
  chatState: Partial<typeof initialChatState> = {},
) => {
  const store = createStore(chatState);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  const rendered = renderHook(() => useChatPageController(), {
    wrapper,
  });

  return {
    ...rendered,
    store,
    queryClient,
  };
};

describe("useChatPageController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    useParamsMock.mockReturnValue({});
    useLocationMock.mockReturnValue({
      key: "default-location",
      state: null,
    });
    getConversationHistoryMock.mockResolvedValue([]);
    streamChatMock.mockImplementation(
      async (
        _params: unknown,
        _signal: AbortSignal,
        callbacks: {
          onMeta?: (payload: {
            conversationId?: string;
            taskId?: string;
          }) => void;
          onMessage: (chunk: string) => void;
          onReasoning?: (chunk: string) => void;
          onFinish?: (payload: { messageId?: string; title?: string }) => void;
          onDone?: () => void;
        },
      ) => {
        callbacks.onMeta?.({
          conversationId: "session-created",
          taskId: "task-created",
        });
        callbacks.onMessage("assistant reply");
        callbacks.onFinish?.({
          messageId: "message-created",
          title: "Created Session",
        });
        callbacks.onDone?.();
      },
    );
  });

  it("does not redirect to the old runtime session when initialQuery is present", async () => {
    useLocationMock.mockReturnValue({
      key: "initial-query-location",
      state: {
        initialQuery: "hello from home",
        model: {
          id: 202,
          aiName: "Chosen Model",
        },
      },
    });

    const { store } = renderChatController({
      currentSessionId: "old-session",
      currentSessionTitle: "Old Session",
      messages: [
        {
          id: "old-message",
          role: "user",
          content: "stale",
          timestamp: 1,
          status: "done",
        },
      ] as ChatMessage[],
    });

    await waitFor(() => {
      expect(streamChatMock).toHaveBeenCalledTimes(1);
      expect(navigateMock).toHaveBeenCalledWith(
        `${ROUTES.chat}/session-created`,
        {
          replace: true,
        },
      );
    });

    expect(navigateMock).not.toHaveBeenCalledWith(
      `${ROUTES.chat}/old-session`,
      expect.anything(),
    );
    expect(store.getState().chat.currentSessionId).toBe("session-created");
    expect(
      store
        .getState()
        .chat.messages.some((message) => message.content === "hello from home"),
    ).toBe(true);
  });

  it("loads history once and hydrates the runtime for a route session", async () => {
    useParamsMock.mockReturnValue({
      sessionId: "history-session",
    });
    getConversationHistoryMock.mockResolvedValue([
      {
        id: "history-2",
        sessionId: "history-session",
        messageType: 2,
        messageContent: "assistant second",
        messageSeq: 2,
        createTime: "2025-01-01T00:00:02.000Z",
      },
      {
        id: "history-1",
        sessionId: "history-session",
        messageType: 1,
        messageContent: "user first",
        messageSeq: 1,
        createTime: "2025-01-01T00:00:01.000Z",
      },
    ]);

    const { result, rerender, store } = renderChatController();

    await waitFor(() => {
      expect(result.current.history.messages).toHaveLength(2);
    });

    expect(getConversationHistoryMock).toHaveBeenCalledTimes(1);
    expect(result.current.history.messages[0]?.content).toBe("user first");
    expect(store.getState().chat.currentSessionId).toBe("history-session");

    rerender();

    expect(getConversationHistoryMock).toHaveBeenCalledTimes(1);
  });

  it("clears stale runtime messages before the new session history resolves", async () => {
    useParamsMock.mockReturnValue({
      sessionId: "new-session",
    });
    const historyDeferred = createDeferred<
      Array<{
        id: string;
        sessionId: string;
        messageType: number;
        messageContent: string;
        messageSeq: number;
        createTime: string;
      }>
    >();
    getConversationHistoryMock.mockReturnValue(historyDeferred.promise);

    const { result } = renderChatController({
      currentSessionId: "old-session",
      currentSessionTitle: "Old Session",
      messages: [
        {
          id: "old-message",
          role: "assistant",
          content: "old content",
          timestamp: 1,
          status: "done",
        },
      ] as ChatMessage[],
    });

    await waitFor(() => {
      expect(result.current.history.messages).toHaveLength(0);
      expect(result.current.history.isLoading).toBe(true);
    });

    act(() => {
      historyDeferred.resolve([
        {
          id: "new-message",
          sessionId: "new-session",
          messageType: 2,
          messageContent: "new content",
          messageSeq: 1,
          createTime: "2025-01-01T00:00:01.000Z",
        },
      ]);
    });

    await waitFor(() => {
      expect(result.current.history.messages[0]?.content).toBe("new content");
    });
  });

  it("sends into an existing route session without creating a conversation", async () => {
    useParamsMock.mockReturnValue({
      sessionId: "existing-session",
    });

    const { result } = renderChatController({
      currentSessionId: "existing-session",
      currentSessionTitle: "Existing",
      messages: [
        {
          id: "history-1",
          role: "assistant",
          content: "ready",
          timestamp: 1,
          status: "done",
        },
      ] as ChatMessage[],
    });

    act(() => {
      result.current.composer.setInput("continue chat");
    });

    await act(async () => {
      result.current.composer.handleSend();
    });

    expect(streamChatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "existing-session",
        inputMessage: "continue chat",
      }),
      expect.any(AbortSignal),
      expect.any(Object),
    );
  });

  it("starts the first message immediately and binds the runtime when HireSpark returns meta", async () => {
    const { result, store } = renderChatController();

    act(() => {
      result.current.composer.setInput("start from scratch");
    });

    await act(async () => {
      result.current.composer.handleSend();
    });

    await waitFor(() => {
      expect(streamChatMock).toHaveBeenCalledTimes(1);
    });

    expect(streamChatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: null,
        inputMessage: "start from scratch",
      }),
      expect.any(AbortSignal),
      expect.any(Object),
    );
    expect(store.getState().chat.currentSessionId).toBe("session-created");
  });

  it("renders reasoning-only first response without requiring content chunks", async () => {
    useParamsMock.mockReturnValue({
      sessionId: "reasoning-session",
    });
    streamChatMock.mockImplementation(
      async (
        _params: unknown,
        _signal: AbortSignal,
        callbacks: {
          onMessage: (chunk: string) => void;
          onReasoning?: (chunk: string) => void;
          onDone?: () => void;
        },
      ) => {
        callbacks.onReasoning?.("嗯，用户");
        callbacks.onReasoning?.("继续补充");
        callbacks.onDone?.();
      },
    );

    const { result } = renderChatController({
      currentSessionId: "reasoning-session",
      currentSessionTitle: "Reasoning Session",
      messages: [
        {
          id: "seed-reasoning",
          role: "assistant",
          content: "seed",
          timestamp: 1,
          status: "done",
        },
      ] as ChatMessage[],
    });

    act(() => {
      result.current.composer.setInput("你好");
    });

    await act(async () => {
      result.current.composer.handleSend();
    });

    await waitFor(() => {
      const assistant = [...result.current.history.messages]
        .reverse()
        .find(
          (message) =>
            message.role === "assistant" && message.id !== "seed-reasoning",
        );
      expect(assistant?.reasoning).toContain("嗯，用户");
      expect(assistant?.content).toBe("");
      expect(assistant?.status).toBe("done");
    });
  });

  it("drops stale stream chunks after switching to another session", async () => {
    useParamsMock.mockReturnValue({
      sessionId: "session-a",
    });

    const streamDeferred = createDeferred<void>();
    let streamCallbacks:
      | {
          onMessage: (chunk: string) => void;
          onDone?: () => void;
        }
      | undefined;
    let streamSignal: AbortSignal | undefined;

    streamChatMock.mockImplementation(
      async (
        _params: unknown,
        signal: AbortSignal,
        callbacks: {
          onMessage: (chunk: string) => void;
          onDone?: () => void;
        },
      ) => {
        streamSignal = signal;
        streamCallbacks = callbacks;
        return streamDeferred.promise;
      },
    );
    getConversationHistoryMock.mockResolvedValue([
      {
        id: "history-a",
        sessionId: "session-a",
        messageType: 2,
        messageContent: "loaded a",
        messageSeq: 1,
        createTime: "2025-01-01T00:00:01.000Z",
      },
    ]);

    const { result, rerender } = renderChatController({
      currentSessionId: "session-a",
      currentSessionTitle: "Session A",
      messages: [
        {
          id: "seed-a",
          role: "assistant",
          content: "loaded a",
          timestamp: 1,
          status: "done",
        },
      ] as ChatMessage[],
    });

    act(() => {
      result.current.composer.setInput("message a");
    });

    await act(async () => {
      result.current.composer.handleSend();
    });

    expect(streamCallbacks).toBeDefined();

    useParamsMock.mockReturnValue({
      sessionId: "session-b",
    });
    getConversationHistoryMock.mockResolvedValueOnce([
      {
        id: "history-b",
        sessionId: "session-b",
        messageType: 2,
        messageContent: "loaded b",
        messageSeq: 1,
        createTime: "2025-01-01T00:00:02.000Z",
      },
    ]);

    rerender();

    await waitFor(() => {
      expect(streamSignal?.aborted).toBe(true);
    });

    act(() => {
      streamCallbacks?.onMessage("stale chunk");
      streamDeferred.resolve();
    });

    await waitFor(() => {
      expect(result.current.history.messages[0]?.content).toBe("loaded b");
    });

    expect(
      result.current.history.messages.some(
        (message) => message.content === "stale chunk",
      ),
    ).toBe(false);
  });

  it("resets the runtime and navigates back to /chat when history loading fails", async () => {
    useParamsMock.mockReturnValue({
      sessionId: "broken-session",
    });
    getConversationHistoryMock.mockRejectedValue(new Error("history failed"));

    const { store } = renderChatController({
      currentSessionId: "old-session",
      currentSessionTitle: "Old Session",
      messages: [
        {
          id: "old-message",
          role: "assistant",
          content: "old content",
          timestamp: 1,
          status: "done",
        },
      ] as ChatMessage[],
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(ROUTES.chat, {
        replace: true,
      });
    });

    expect(store.getState().chat.currentSessionId).toBeNull();
    expect(store.getState().chat.messages).toHaveLength(0);
  });
});
