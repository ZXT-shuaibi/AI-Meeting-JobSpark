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
