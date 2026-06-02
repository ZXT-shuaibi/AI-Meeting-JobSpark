import { Link, useLocation } from "react-router-dom";
import { FileText, MessageSquare, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  isCollapsed?: boolean;
};

export default function SidebarNav({ isCollapsed }: SidebarNavProps) {
  const location = useLocation();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isLegacyInterviewActive =
    location.pathname === "/interview" ||
    location.pathname.startsWith("/interview/");
  const isInterviewReportActive = isActive(ROUTES.interviewReport);
  const isResumeActive =
    location.pathname === ROUTES.career ||
    location.pathname.startsWith("/career/resumes") ||
    location.pathname.startsWith("/career/optimizations") ||
    location.pathname.startsWith("/career/resume") ||
    location.pathname.startsWith("/resume");
  const isInterviewActive =
    isActive(ROUTES.interviewIntro) ||
    isInterviewReportActive ||
    isLegacyInterviewActive;

  return (
    <div className="px-3">
      <div className="space-y-1">
        <Link to={ROUTES.chat}>
          <Button
            variant={isActive(ROUTES.chat) ? "secondary" : "ghost"}
            className={cn(
              "w-full rounded-full",
              isCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <MessageSquare className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "\u65b0\u5bf9\u8bdd"}
          </Button>
        </Link>

        <Link to={ROUTES.resumeList}>
          <Button
            variant={isResumeActive ? "secondary" : "ghost"}
            className={cn(
              "w-full rounded-full",
              isCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <FileText className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "\u7b80\u5386\u5de5\u4f5c\u53f0"}
          </Button>
        </Link>

        <Link to={ROUTES.interviewIntro}>
          <Button
            variant={isInterviewActive ? "secondary" : "ghost"}
            className={cn(
              "w-full rounded-full",
              isCollapsed ? "justify-center" : "justify-start",
            )}
          >
            <Video className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "AI \u9762\u8bd5"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
