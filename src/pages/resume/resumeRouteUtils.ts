import { ROUTES } from "@/lib/constants";

export const isPreviewResumePath = (pathname: string) =>
  pathname.startsWith("/preview/resume");

export const getResumeRouteSet = (pathname: string) =>
  isPreviewResumePath(pathname)
    ? {
        list: ROUTES.previewResumeList,
        upload: ROUTES.previewResumeUpload,
        optimize: ROUTES.previewResumeOptimize,
        detail: ROUTES.previewResumeDetail,
      }
    : {
        list: ROUTES.resumeList,
        upload: ROUTES.resumeUpload,
        optimize: ROUTES.resumeOptimize,
        detail: ROUTES.resumeDetail,
      };

export const buildResumeDetailPath = (
  detailRoute: string,
  resumeVersionId: string,
) =>
  detailRoute.startsWith("/preview/resume")
    ? `${detailRoute}?id=${encodeURIComponent(resumeVersionId)}`
    : detailRoute.replace(
        ":resumeVersionId",
        encodeURIComponent(resumeVersionId),
      );

export const getResumeVersionIdFromRoute = ({
  pathname,
  params,
  search,
}: {
  pathname: string;
  params?: {
    resumeVersionId?: string | null;
  };
  search?: string;
}) => {
  const paramResumeVersionId = params?.resumeVersionId?.trim() || "";
  if (paramResumeVersionId && paramResumeVersionId !== "detail") {
    return paramResumeVersionId;
  }

  const pathnameMatch = pathname.match(/^\/career\/resumes\/([^/?#]+)$/u);
  const pathnameResumeVersionId = pathnameMatch?.[1]?.trim() || "";
  if (pathnameResumeVersionId && pathnameResumeVersionId !== "detail") {
    return decodeURIComponent(pathnameResumeVersionId);
  }

  const queryResumeVersionId =
    new URLSearchParams(search || "").get("id")?.trim() || "";
  return queryResumeVersionId || null;
};
