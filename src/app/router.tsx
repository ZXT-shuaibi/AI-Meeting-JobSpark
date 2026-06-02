import { Suspense, lazy, type ReactNode } from "react";
import {
  Navigate,
  createBrowserRouter,
  type RouteObject,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import AppLayout from "@/layouts/AppLayout";
import { ROUTES } from "@/lib/constants";
import { useAppSelector } from "@/store/hooks";

const AuthPage = lazy(() => import("@/pages/auth/AuthPage"));
const MarketingHomePage = lazy(
  () => import("@/pages/marketing/MarketingHomePage"),
);
const ChatPage = lazy(() => import("@/pages/chat/ChatPage"));
const ResumeListPage = lazy(() => import("@/pages/resume/ResumeListPage"));
const ResumeUploadPage = lazy(() => import("@/pages/resume/ResumeUploadPage"));
const ResumeOptimizePage = lazy(
  () => import("@/pages/resume/ResumeOptimizePage"),
);
const ResumeDetailPage = lazy(() => import("@/pages/resume/ResumeDetailPage"));
const InterviewIntroPage = lazy(
  () => import("@/pages/interview/InterviewIntroPage"),
);
const InterviewPage = lazy(() => import("@/pages/interview/InterviewPage"));
const InterviewReportPage = lazy(
  () => import("@/pages/interview/InterviewReportPage"),
);
const InterviewReportDetailPage = lazy(
  () => import("@/pages/interview/InterviewReportDetailPage"),
);

function RouteLoadingScreen() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
    </div>
  );
}

const withRouteSuspense = (node: ReactNode) => (
  <Suspense fallback={<RouteLoadingScreen />}>{node}</Suspense>
);

function HomeRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.user);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.career} replace />;
  }

  return withRouteSuspense(<MarketingHomePage />);
}

export const appRoutes: RouteObject[] = [
  {
    path: ROUTES.home,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomeRoute />,
      },
      {
        path: ROUTES.auth,
        element: withRouteSuspense(<AuthPage />),
      },
      {
        path: ROUTES.previewResumeList,
        element: withRouteSuspense(<ResumeListPage />),
      },
      {
        path: ROUTES.previewResumeUpload,
        element: withRouteSuspense(<ResumeUploadPage />),
      },
      {
        path: ROUTES.previewResumeOptimize,
        element: withRouteSuspense(<ResumeOptimizePage />),
      },
      {
        path: ROUTES.previewResumeDetail,
        element: withRouteSuspense(<ResumeDetailPage />),
      },
      {
        element: <AuthGuard />,
        children: [
          {
            path: ROUTES.interviewIntro,
            element: withRouteSuspense(<InterviewIntroPage />),
          },
          {
            path: "/interview",
            element: withRouteSuspense(<InterviewIntroPage />),
          },
          {
            path: ROUTES.interviewRoom,
            element: withRouteSuspense(<InterviewPage />),
          },
          {
            path: "/interview/room",
            element: withRouteSuspense(<InterviewPage />),
          },
          {
            path: `${ROUTES.interviewRoom}/:sessionId`,
            element: withRouteSuspense(<InterviewPage />),
          },
          {
            path: "/interview/room/:sessionId",
            element: withRouteSuspense(<InterviewPage />),
          },
          {
            path: ROUTES.interviewReport,
            element: withRouteSuspense(<InterviewReportPage />),
          },
          {
            path: "/interview/report",
            element: withRouteSuspense(<InterviewReportPage />),
          },
          {
            path: ROUTES.interviewReportDetail,
            element: withRouteSuspense(<InterviewReportDetailPage />),
          },
          {
            path: "/interview/report/detail",
            element: withRouteSuspense(<InterviewReportDetailPage />),
          },
          {
            path: `${ROUTES.chat}/:sessionId?`,
            element: withRouteSuspense(<ChatPage />),
          },
          {
            path: ROUTES.resumeList,
            element: withRouteSuspense(<ResumeListPage />),
          },
          {
            path: "/resume/list",
            element: withRouteSuspense(<ResumeListPage />),
          },
          {
            path: ROUTES.resumeUpload,
            element: withRouteSuspense(<ResumeUploadPage />),
          },
          {
            path: "/resume/upload",
            element: withRouteSuspense(<ResumeUploadPage />),
          },
          {
            path: ROUTES.resumeOptimize,
            element: withRouteSuspense(<ResumeOptimizePage />),
          },
          {
            path: "/resume/optimize",
            element: withRouteSuspense(<ResumeOptimizePage />),
          },
          {
            path: ROUTES.resumeDetail,
            element: withRouteSuspense(<ResumeDetailPage />),
          },
          {
            path: "/resume/detail",
            element: withRouteSuspense(<ResumeDetailPage />),
          },
          {
            path: ROUTES.questionBank,
            element: <Navigate to={ROUTES.chat} replace />,
          },
          {
            path: ROUTES.questionBankManage,
            element: <Navigate to={ROUTES.chat} replace />,
          },
        ],
      },
    ],
  },
];

export const appRouter = createBrowserRouter(appRoutes);
