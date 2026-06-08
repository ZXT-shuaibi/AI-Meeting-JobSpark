import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CHAT_STREAM_ERROR_TEXT,
  createRuntimeMessageId,
} from "@/hooks/chat/chatRuntime.shared";
import {
  getConversationUserKey,
  getConversationsQueryKey,
} from "@/hooks/useConversations";
import { CHAT_ROLES, ROUTES } from "@/lib/constants";
import { CHAT_MESSAGE_STATUS, type ChatMessage } from "@/lib/chat";
import {
  createTextStreamLimiter,
  type TextStreamLimiter,
} from "@/lib/streamLimiter";
import { aiService } from "@/services/aiService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  appendAssistantChunk,
  appendAssistantPlaceholder,
  appendAssistantReasoningChunk,
  appendUserMessage,
  failAssistantMessage,
  finishAssistantMessage,
  setActiveStream,
  setChatRuntimeSession,
} from "@/store/slices/chatSlice";

type SendMessageOptions = {
  forceNewSession?: boolean;
};

type UseChatSendFlowOptions = {
  routeSessionId: string | null;
  navigateToSession: (
    sessionId: string,
    options?: { replace?: boolean },
  ) => void;
};

type StreamOutbound = {
  requestId: string;
  sessionId: string | null;
  assistantMessageId: string;
  content: string;
  aiId?: number;
  fallbackTitle: string;
};

export function useChatSendFlow({
  routeSessionId,
  navigateToSession,
}: UseChatSendFlowOptions) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { messages, isStreaming, currentSessionId } = useAppSelector(
    (state) => state.chat,
  );
  const { currentUser, authEpoch } = useAppSelector((state) => state.user);

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const cancelActiveStreamRef = useRef<() => void>(() => undefined);

  const cancelActiveStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    activeRequestIdRef.current = null;
    dispatch(setActiveStream(null));
  }, [dispatch]);

  useEffect(() => {
    cancelActiveStreamRef.current = cancelActiveStream;
  }, [cancelActiveStream]);

  const streamMessage = useCallback(
    async (outbound: StreamOutbound) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      activeRequestIdRef.current = outbound.requestId;
      let resolvedSessionId = outbound.sessionId;

      let contentLimiter: TextStreamLimiter | null = null;
      let reasoningLimiter: TextStreamLimiter | null = null;
      let hasFinalizedMessage = false;

      const isActiveRequest = () =>
        activeRequestIdRef.current === outbound.requestId &&
        abortControllerRef.current === abortController;

      dispatch(
        setActiveStream({
          requestId: outbound.requestId,
          sessionId: outbound.sessionId || outbound.requestId,
          messageId: outbound.assistantMessageId,
        }),
      );

      contentLimiter = createTextStreamLimiter({
        intervalMs: 40,
        charsPerTick: 12,
        onUpdate: (nextChunk) => {
          if (!isActiveRequest()) {
            return;
          }
          dispatch(
            appendAssistantChunk({
              id: outbound.assistantMessageId,
              content: nextChunk,
            }),
          );
        },
      });

      reasoningLimiter = createTextStreamLimiter({
        intervalMs: 40,
        charsPerTick: 12,
        onUpdate: (nextChunk) => {
          if (!isActiveRequest()) {
            return;
          }
          dispatch(
            appendAssistantReasoningChunk({
              id: outbound.assistantMessageId,
              reasoning: nextChunk,
            }),
          );
        },
      });

      try {
        await aiService.streamChat(
          {
            sessionId: outbound.sessionId,
            inputMessage: outbound.content,
            userName: currentUser?.username || "Guest",
            aiId: outbound.aiId,
          },
          abortController.signal,
          {
            onMeta: (payload) => {
              if (!isActiveRequest()) {
                return;
              }
              const nextSessionId = payload.conversationId?.trim() || "";
              if (!nextSessionId) {
                return;
              }
              resolvedSessionId = nextSessionId;
              dispatch(
                setChatRuntimeSession({
                  sessionId: nextSessionId,
                  title: outbound.fallbackTitle,
                }),
              );
              navigateToSession(nextSessionId, {
                replace: true,
              });

              const userKey = getConversationUserKey(currentUser);
              void queryClient.invalidateQueries({
                queryKey: getConversationsQueryKey(userKey, authEpoch),
              });
            },
            onMessage: (chunk) => {
              if (!isActiveRequest()) {
                return;
              }
              contentLimiter?.push(chunk);
            },
            onReasoning: (chunk) => {
              if (!isActiveRequest()) {
                return;
              }
              reasoningLimiter?.push(chunk);
            },
            onFinish: (payload) => {
              if (!isActiveRequest()) {
                return;
              }
              const currentTitle = payload.title?.trim();
              if (!currentTitle) {
                return;
              }
              const runtimeSessionId = resolvedSessionId?.trim() || "";
              if (!runtimeSessionId) {
                return;
              }
              dispatch(
                setChatRuntimeSession({
                  sessionId: runtimeSessionId,
                  title: currentTitle,
                }),
              );
            },
            onDone: () => {
              if (!isActiveRequest()) {
                return;
              }
              contentLimiter?.flush();
              reasoningLimiter?.flush();
              dispatch(
                finishAssistantMessage({
                  id: outbound.assistantMessageId,
                }),
              );
              hasFinalizedMessage = true;
              dispatch(setActiveStream(null));
              activeRequestIdRef.current = null;
              abortControllerRef.current = null;
            },
            onError: (error) => {
              if (error.message === "Connection closed") {
                return;
              }
              console.error("Stream error callback:", error);
            },
          },
        );
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (error.name === "AbortError" || error.message === "Connection closed")
        ) {
          if (!hasFinalizedMessage) {
            dispatch(
              finishAssistantMessage({
                id: outbound.assistantMessageId,
              }),
            );
            hasFinalizedMessage = true;
          }
          return;
        }

        console.error("Chat error:", error);
        dispatch(
          failAssistantMessage({
            id: outbound.assistantMessageId,
            errorMessage:
              error instanceof Error ? error.message : CHAT_STREAM_ERROR_TEXT,
          }),
        );
      } finally {
        contentLimiter?.flush();
        reasoningLimiter?.flush();
        contentLimiter?.stop();
        reasoningLimiter?.stop();

        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
        if (activeRequestIdRef.current === outbound.requestId) {
          activeRequestIdRef.current = null;
        }
        dispatch(setActiveStream(null));
      }
    },
    [authEpoch, currentUser, dispatch, navigateToSession, queryClient],
  );

  const sendMessage = useCallback(
    async (content: string, aiId?: number, options?: SendMessageOptions) => {
      const nextContent = content.trim();
      if (!nextContent || isStreaming) {
        return;
      }

      cancelActiveStream();

      const requestId = createRuntimeMessageId("chat-request");
      const userMessage: ChatMessage = {
        id: createRuntimeMessageId("chat-user"),
        role: CHAT_ROLES.user,
        content: nextContent,
        timestamp: Date.now(),
        status: CHAT_MESSAGE_STATUS.done,
      };
      const assistantMessage: ChatMessage = {
        id: createRuntimeMessageId("chat-assistant"),
        role: CHAT_ROLES.assistant,
        content: "",
        timestamp: Date.now(),
        status: CHAT_MESSAGE_STATUS.streaming,
      };

      dispatch(appendUserMessage(userMessage));
      dispatch(appendAssistantPlaceholder(assistantMessage));

      try {
        const activeSessionId =
          options?.forceNewSession === true
            ? null
            : routeSessionId || currentSessionId;

        await streamMessage({
          requestId,
          sessionId: activeSessionId,
          assistantMessageId: assistantMessage.id,
          content: nextContent,
          aiId,
          fallbackTitle: nextContent.slice(0, 24) || "New chat",
        });
      } catch (error: unknown) {
        console.error("Chat error:", error);
        dispatch(
          failAssistantMessage({
            id: assistantMessage.id,
            errorMessage:
              error instanceof Error ? error.message : CHAT_STREAM_ERROR_TEXT,
          }),
        );
      }
    },
    [
      cancelActiveStream,
      currentSessionId,
      dispatch,
      isStreaming,
      routeSessionId,
      streamMessage,
    ],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith(ROUTES.chat)) {
          return;
        }
      }
      cancelActiveStreamRef.current();
    };
  }, []);

  return {
    messages,
    isStreaming,
    sendMessage,
    cancelActiveStream,
  };
}
