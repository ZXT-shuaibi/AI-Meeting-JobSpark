import { useCallback, type UIEvent } from "react";

import { useConversations } from "@/hooks/useConversations";

export function useSidebarHistoryController(isCollapsed?: boolean) {
  const shouldFetchConversations = !isCollapsed;

  const { conversations, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useConversations({
      enabled: shouldFetchConversations,
    });

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;

      if (scrollHeight - scrollTop > clientHeight * 1.5) {
        return;
      }

      if (shouldFetchConversations && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, shouldFetchConversations],
  );

  return {
    conversations,
    hasNextPage,
    isFetchingNextPage,
    handleScroll,
  };
}
