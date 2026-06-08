import service, { assertRequestAuthorized, buildApiUrl } from "@/lib/request";
import type {
  AiConversation,
  AiConversationsPageResult,
  AiMessageHistory,
  AiMessageHistoryListResult,
  AiMessageHistoryPageResult,
  AiProperty,
  AiPropertiesPageResult,
  ChatStreamParams,
  ChatStreamCompletion,
  ChatStreamMeta,
  GetConversationsParams,
  GetHistoryMessagesPageParams,
  StreamCallbacks,
} from "@/types/ai";
import { fetchEventSource } from "@microsoft/fetch-event-source";

type StreamParseResult = {
  content?: string;
  reasoning?: string;
  done?: boolean;
};

type RagSettingsResponse = {
  ai?: {
    chat?: {
      defaultModel?: string | null;
      deepThinkingModel?: string | null;
      candidates?: Array<{
        id?: string | null;
        provider?: string | null;
        model?: string | null;
        enabled?: boolean | null;
        supportsThinking?: boolean | null;
      }>;
    };
  };
};

type ConversationSummaryResponse = {
  conversationId?: string | null;
  title?: string | null;
  lastTime?: string | null;
};

type ConversationMessageResponse = {
  id?: string | null;
  conversationId?: string | null;
  role?: string | null;
  content?: string | null;
  thinkingContent?: string | null;
  createTime?: string | null;
};

type StreamMessageDelta = {
  type?: string | null;
  delta?: string | null;
};

const modelThinkingMap = new Map<number, boolean>();

const STREAM_DONE_MARKERS = new Set([
  "done",
  "end",
  "message_end",
  "message_stop",
  "completed",
  "complete",
  "stop",
]);

const STREAM_REASONING_MARKERS = new Set([
  "reasoning",
  "reasoning_content",
  "thinking",
  "thinking_content",
]);

const normalizeStreamMarker = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const isDoneStreamMarker = (value: unknown) =>
  STREAM_DONE_MARKERS.has(normalizeStreamMarker(value));

const isDoneStreamEvent = (value: unknown) =>
  isDoneStreamMarker(value) || normalizeStreamMarker(value) === "[done]";

const normalizeString = (value: unknown) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
};

const normalizeBooleanFlag = (value: unknown) =>
  value === true || value === 1 || value === "1";

const mapRagSettingsToAiProperties = (
  payload: RagSettingsResponse,
): AiPropertiesPageResult => {
  const candidates = payload.ai?.chat?.candidates ?? [];
  const records = candidates
    .filter((candidate) => normalizeBooleanFlag(candidate.enabled ?? true))
    .map<AiProperty>((candidate, index) => {
      const aiName =
        normalizeString(candidate.model) ||
        normalizeString(candidate.id) ||
        `HireSpark Model ${index + 1}`;
      const aiType = normalizeString(candidate.provider) || "hirespark-rag";
      const id = index + 1;
      const enableThinking = normalizeBooleanFlag(candidate.supportsThinking)
        ? 1
        : 0;
      modelThinkingMap.set(id, enableThinking === 1);
      return {
        id,
        aiName,
        aiType,
        modelName: normalizeString(candidate.model) || aiName,
        isEnabled: 1,
        enableThinking,
      };
    });

  return {
    records,
    total: records.length,
    size: records.length || 0,
    current: 1,
    pages: records.length > 0 ? 1 : 0,
  };
};

const mapConversationListToPage = (
  payload: ConversationSummaryResponse[],
  params?: GetConversationsParams,
): AiConversationsPageResult => {
  const current = params?.current ?? 1;
  const size = params?.size ?? payload.length ?? 20;
  const records = payload.map<AiConversation>((item) => {
    const sessionId =
      normalizeString(item.conversationId) || `conversation-${Math.random()}`;
    const lastTime = normalizeString(item.lastTime) || undefined;
    return {
      sessionId,
      username: "current-user",
      aiId: 0,
      title: normalizeString(item.title) || sessionId,
      status: 2,
      messageCount: undefined,
      createTime: lastTime,
      updateTime: lastTime,
      lastMessageTime: lastTime,
      aiName: "HireSpark RAG",
    };
  });

  return {
    records,
    total: records.length,
    size,
    current,
    pages: records.length > 0 ? 1 : 0,
  };
};

const mapConversationMessagesToHistory = (
  payload: ConversationMessageResponse[],
): AiMessageHistoryListResult =>
  payload.map<AiMessageHistory>((item, index) => {
    const sessionId =
      normalizeString(item.conversationId) || "unknown-conversation";
    const role = normalizeStreamMarker(item.role);
    return {
      id: normalizeString(item.id) || `${sessionId}-${index + 1}`,
      sessionId,
      messageType: role === "user" ? 1 : 2,
      messageContent: normalizeString(item.content),
      messageSeq: index + 1,
      reasoningContent: normalizeString(item.thinkingContent) || undefined,
      createTime: normalizeString(item.createTime) || undefined,
    };
  });

const pageConversationMessages = (
  records: AiMessageHistoryListResult,
  params: GetHistoryMessagesPageParams,
): AiMessageHistoryPageResult => {
  const current = Math.max(1, params.current);
  const size = Math.max(1, params.size);
  const start = (current - 1) * size;
  const pagedRecords = records.slice(start, start + size);
  return {
    records: pagedRecords,
    total: records.length,
    size,
    current,
    pages: Math.ceil(records.length / size),
  };
};

const parseMetaPayload = (raw: string): ChatStreamMeta | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const conversationId = normalizeString(parsed.conversationId) || undefined;
    const taskId = normalizeString(parsed.taskId) || undefined;
    if (!conversationId && !taskId) {
      return null;
    }
    return { conversationId, taskId };
  } catch {
    return null;
  }
};

const parseCompletionPayload = (raw: string): ChatStreamCompletion | null => {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const messageId = normalizeString(parsed.messageId) || undefined;
    const title = normalizeString(parsed.title) || undefined;
    if (!messageId && !title) {
      return null;
    }
    return { messageId, title };
  } catch {
    return null;
  }
};

const parseMessageDelta = (raw: string): StreamParseResult => {
  try {
    const parsed = JSON.parse(raw) as StreamMessageDelta;
    const delta = normalizeString(parsed.delta);
    if (!delta) {
      return {};
    }
    return normalizeStreamMarker(parsed.type) === "think"
      ? { reasoning: delta }
      : { content: delta };
  } catch {
    return parseAiStreamChunk(raw);
  }
};

const shouldEnableDeepThinking = (aiId?: number) => {
  if (typeof aiId !== "number" || !Number.isFinite(aiId)) {
    return false;
  }
  return modelThinkingMap.get(aiId) ?? false;
};

const parseAiStreamChunk = (raw: string): StreamParseResult => {
  const payload = raw.trim();
  if (!payload) {
    return {};
  }

  if (payload.toUpperCase() === "[DONE]") {
    return { done: true };
  }

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    const nestedData =
      typeof parsed.data === "object" &&
      parsed.data !== null &&
      !Array.isArray(parsed.data)
        ? (parsed.data as Record<string, unknown>)
        : null;
    const source = nestedData ?? parsed;
    const type = normalizeStreamMarker(source.type);

    if (
      source.done === true ||
      isDoneStreamMarker(type) ||
      isDoneStreamMarker(source.action) ||
      isDoneStreamMarker(source.event) ||
      isDoneStreamMarker(source.finish_reason)
    ) {
      return { done: true };
    }

    if (typeof source.content === "string") {
      if (STREAM_REASONING_MARKERS.has(type)) {
        return { reasoning: source.content };
      }
      return { content: source.content };
    }

    if (typeof source.reasoning === "string") {
      return { reasoning: source.reasoning };
    }
    if (typeof source.reasoning_content === "string") {
      return { reasoning: source.reasoning_content };
    }
    if (typeof source.reasoningContent === "string") {
      return { reasoning: source.reasoningContent };
    }

    const choices = source.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const firstChoice = choices[0] as Record<string, unknown>;
      const delta = firstChoice.delta as Record<string, unknown> | undefined;
      const message = firstChoice.message as
        | Record<string, unknown>
        | undefined;
      if (
        isDoneStreamMarker(firstChoice.finish_reason) ||
        firstChoice.done === true
      ) {
        return { done: true };
      }
      if (typeof delta?.reasoning === "string") {
        return { reasoning: delta.reasoning };
      }
      if (typeof delta?.reasoning_content === "string") {
        return { reasoning: delta.reasoning_content };
      }
      if (typeof delta?.content === "string") {
        return { content: delta.content };
      }
      if (typeof message?.reasoning === "string") {
        return { reasoning: message.reasoning };
      }
      if (typeof message?.reasoning_content === "string") {
        return { reasoning: message.reasoning_content };
      }
      if (typeof message?.content === "string") {
        return { content: message.content };
      }
    }

    return {};
  } catch {
    return { content: payload };
  }
};

export const aiService = {
  getAiProperties: async () => {
    const payload = await service.get<RagSettingsResponse>("/rag/settings");
    return mapRagSettingsToAiProperties(payload);
  },

  getConversations: async (params?: GetConversationsParams) => {
    const payload =
      await service.get<ConversationSummaryResponse[]>("/conversations");
    return mapConversationListToPage(payload, params);
  },

  getConversationHistory: async (sessionId: string, signal?: AbortSignal) => {
    const payload = await service.get<ConversationMessageResponse[]>(
      `/conversations/${encodeURIComponent(sessionId)}/messages`,
      signal ? { signal } : undefined,
    );
    return mapConversationMessagesToHistory(payload);
  },

  pageHistoryMessages: async (params: GetHistoryMessagesPageParams) => {
    const sessionId = normalizeString(params.sessionId);
    if (!sessionId) {
      return {
        records: [],
        total: 0,
        size: Math.max(1, params.size),
        current: Math.max(1, params.current),
        pages: 0,
      };
    }
    const records = await aiService.getConversationHistory(sessionId);
    return pageConversationMessages(records, params);
  },

  streamChat: async (
    params: ChatStreamParams,
    signal: AbortSignal,
    callbacks: StreamCallbacks,
  ) => {
    const { inputMessage, aiId } = params;
    const normalizedSessionId = normalizeString(params.sessionId);
    const url = buildApiUrl("/rag/v3/chat", {
      question: inputMessage,
      conversationId: normalizedSessionId || undefined,
      deepThinking: shouldEnableDeepThinking(aiId) || undefined,
    });
    const token = assertRequestAuthorized("/rag/v3/chat");

    let isComplete = false;
    let activeTaskId: string | null = null;
    let stopRequested = false;

    const requestStopIfNeeded = async () => {
      if (stopRequested || !activeTaskId) {
        return;
      }
      stopRequested = true;
      try {
        await service.post<void>("/rag/v3/stop", undefined, {
          params: {
            taskId: activeTaskId,
          },
        });
      } catch (error) {
        console.warn("Failed to stop active rag task", error);
      }
    };

    signal.addEventListener(
      "abort",
      () => {
        void requestStopIfNeeded();
      },
      { once: true },
    );

    await fetchEventSource(url, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal,
      openWhenHidden: true,

      async onopen(response) {
        if (response.ok) {
          return;
        }
        if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          throw new Error(`Failed to send chat: ${response.statusText}`);
        }
        throw new Error(`Server error: ${response.statusText}`);
      },

      onmessage(msg) {
        const normalizedEvent = normalizeStreamMarker(msg.event);
        if (normalizedEvent === "meta") {
          const meta = parseMetaPayload(msg.data);
          if (!meta) {
            return;
          }
          activeTaskId = meta.taskId ?? activeTaskId;
          callbacks.onMeta?.(meta);
          return;
        }

        if (normalizedEvent === "finish" || normalizedEvent === "cancel") {
          const completion = parseCompletionPayload(msg.data);
          if (completion) {
            callbacks.onFinish?.(completion);
          }
          return;
        }

        if (
          isDoneStreamEvent(normalizedEvent) ||
          msg.data.trim().toUpperCase() === "[DONE]"
        ) {
          isComplete = true;
          callbacks.onDone?.();
          return;
        }

        const parsed =
          normalizedEvent === "message" || normalizedEvent === "reject"
            ? parseMessageDelta(msg.data)
            : parseAiStreamChunk(msg.data);
        if (parsed.done) {
          isComplete = true;
          callbacks.onDone?.();
          return;
        }
        if (parsed.reasoning) {
          callbacks.onReasoning?.(parsed.reasoning);
        }
        if (parsed.content) {
          callbacks.onMessage(parsed.content);
        }
      },

      onclose() {
        if (isComplete) {
          return;
        }
        throw new Error("Connection closed");
      },

      onerror(err) {
        callbacks.onError?.(err);
        throw err;
      },
    });
  },
};
