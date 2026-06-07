import { useLocation, useNavigate } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ROUTES } from "@/lib/constants";
import SidebarSessionList from "@/components/layout/sidebar/SidebarSessionList";
import { useSidebarHistoryController } from "@/hooks/layout/useSidebarHistoryController";

type SidebarHistoryProps = {
  isCollapsed?: boolean;
};

export default function SidebarHistory({ isCollapsed }: SidebarHistoryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversations, hasNextPage, isFetchingNextPage, handleScroll } =
    useSidebarHistoryController(isCollapsed);

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden px-3">
      <div className="mb-2 flex shrink-0 items-center justify-between px-2 text-xs text-slate-400">
        <span>历史会话</span>
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </div>

      <ScrollArea className="-mx-2 flex-1" onScrollCapture={handleScroll}>
        <div className="space-y-1 px-2 pb-2">
          <SidebarSessionList
            conversations={conversations}
            activePathname={location.pathname}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onOpenSession={(sessionId) =>
              navigate(`${ROUTES.chat}/${sessionId}`)
            }
          />
        </div>
      </ScrollArea>
    </div>
  );
}
