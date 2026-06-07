import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { isStaticPreviewEnabled } from "@/config/env";
import {
  buildInterviewReportViewModel,
  fetchInterviewReportQueryData,
  STATIC_PREVIEW_INTERVIEW_DIRECTION,
  STATIC_PREVIEW_INTERVIEW_REPORT,
} from "@/hooks/interview/report/interviewReportData.shared";

export function useInterviewReportData(reportSessionId: string | null) {
  const staticPreviewEnabled = isStaticPreviewEnabled();

  const query = useQuery({
    queryKey: ["interview-report", reportSessionId],
    enabled: !staticPreviewEnabled && Boolean(reportSessionId),
    queryFn: () => fetchInterviewReportQueryData(reportSessionId as string),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const previewViewModel = useMemo(
    () => buildInterviewReportViewModel(STATIC_PREVIEW_INTERVIEW_REPORT),
    [],
  );

  const reportViewModel = useMemo(() => {
    if (staticPreviewEnabled) {
      return {
        ...previewViewModel,
        interviewDirection: STATIC_PREVIEW_INTERVIEW_DIRECTION,
      };
    }

    return buildInterviewReportViewModel(query.data?.report ?? null);
  }, [previewViewModel, query.data?.report, staticPreviewEnabled]);

  const recordError = useMemo(() => {
    if (staticPreviewEnabled || !query.error) {
      return null;
    }
    return query.error instanceof Error
      ? query.error.message
      : "加载面试报告时发生错误，请稍后重试。";
  }, [query.error, staticPreviewEnabled]);

  return {
    isRecordLoading: staticPreviewEnabled
      ? false
      : query.isLoading || query.isFetching,
    recordError,
    ...reportViewModel,
  };
}
