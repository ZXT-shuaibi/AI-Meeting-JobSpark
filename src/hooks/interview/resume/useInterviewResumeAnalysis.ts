import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { resolveInterviewTypeLabel } from "@/hooks/interview/shared/interviewUtils";
import { useInterviewResumePreviewState } from "@/hooks/interview/resume/useInterviewResumePreviewState";
import { useInterviewUploadStage } from "@/hooks/interview/resume/useInterviewUploadStage";
import {
  readCareerInterviewSessionBinding,
  readCareerWorkspaceSnapshot,
  writeCareerInterviewSessionBinding,
} from "@/lib/careerWorkspaceStorage";
import { getCareerResumeVersion } from "@/services/careerService";

type UseInterviewResumeAnalysisOptions = {
  interviewerSessionId: string | null;
};

const HIRESPARK_PREVIEW_UNAVAILABLE_MESSAGE =
  "当前面试已绑定 HireSpark 简历版本，暂不提供原始 PDF 预览，请返回简历工作台查看正文。";
const MISSING_WORKSPACE_RESUME_MESSAGE =
  "未找到与当前面试绑定的简历版本，请返回简历工作台重新发起面试。";
const INTERVIEW_UPLOAD_DISABLED_MESSAGE =
  "请先从简历工作台选择简历并创建面试会话。";

export function useInterviewResumeAnalysis({
  interviewerSessionId,
}: UseInterviewResumeAnalysisOptions) {
  const [resumeScore, setResumeScore] = useState<number | null>(null);
  const [resumeInterviewType, setResumeInterviewType] = useState<string | null>(
    null,
  );
  const [resumeSuggestions, setResumeSuggestions] = useState<string[]>([]);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(
    null,
  );
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const {
    resumeName,
    setResumeName,
    resumeFileUrl,
    resumeRemoteFile,
    resumeLocalFile,
    resumePreviewError,
    setResumePreviewError,
    numPages,
    resumePreviewSource,
    resumeOpenPreviewUrl,
    clearRemoteResumePreview,
    handleResumePreviewLoadSuccess,
    handleResumePreviewLoadError,
  } = useInterviewResumePreviewState();
  const { isResumeUploading, resumeUploadStage } = useInterviewUploadStage();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hydratedSessionIdRef = useRef<string | null>(null);

  const resolvedInterviewTypeLabel =
    resolveInterviewTypeLabel(resumeInterviewType);

  const resetResumeMetadata = useCallback(() => {
    setResumeScore(null);
    setResumeInterviewType(null);
    setResumeSuggestions([]);
    setResumeUploadError(null);
  }, []);

  const applyResumeMetadata = useCallback(
    (metadata: {
      resumeName?: string | null;
      resumeScore: number | null;
      resumeInterviewType: string | null;
      resumeSuggestions: string[];
    }) => {
      setResumeName(metadata.resumeName ?? null);
      setResumeScore(metadata.resumeScore);
      setResumeInterviewType(metadata.resumeInterviewType);
      setResumeSuggestions(metadata.resumeSuggestions);
    },
    [setResumeName],
  );

  useEffect(() => {
    if (!interviewerSessionId) {
      hydratedSessionIdRef.current = null;
    }
  }, [interviewerSessionId]);

  useEffect(() => {
    if (!interviewerSessionId || isResumeUploading) {
      return;
    }
    if (hydratedSessionIdRef.current === interviewerSessionId) {
      return;
    }

    let cancelled = false;

    const hydrateResumeState = async () => {
      try {
        const sessionBinding =
          readCareerInterviewSessionBinding(interviewerSessionId);
        const workspace = readCareerWorkspaceSnapshot();
        const resumeVersionId =
          sessionBinding?.resumeVersionId?.trim() ||
          workspace.resumeVersionId?.trim() ||
          null;

        if (!resumeVersionId) {
          if (cancelled) {
            return;
          }
          clearRemoteResumePreview();
          resetResumeMetadata();
          setResumeUploadError(MISSING_WORKSPACE_RESUME_MESSAGE);
          setResumePreviewError(MISSING_WORKSPACE_RESUME_MESSAGE);
          hydratedSessionIdRef.current = interviewerSessionId;
          return;
        }

        const resumeVersion = await getCareerResumeVersion(resumeVersionId);
        if (cancelled) {
          return;
        }

        writeCareerInterviewSessionBinding(interviewerSessionId, {
          profileId: resumeVersion.profileId,
          resumeVersionId: resumeVersion.id,
          jdId: sessionBinding?.jdId ?? null,
        });
        clearRemoteResumePreview();
        applyResumeMetadata({
          resumeName:
            resumeVersion.title?.trim() || `简历版本 ${resumeVersion.id}`,
          resumeScore: null,
          resumeInterviewType: null,
          resumeSuggestions: [],
        });
        setResumeUploadError(null);
        setResumePreviewError(HIRESPARK_PREVIEW_UNAVAILABLE_MESSAGE);
        hydratedSessionIdRef.current = interviewerSessionId;
      } catch (error) {
        if (cancelled) {
          return;
        }
        clearRemoteResumePreview();
        resetResumeMetadata();
        setResumeUploadError(
          error instanceof Error
            ? error.message
            : "Failed to load bound resume version",
        );
      }
    };

    void hydrateResumeState();

    return () => {
      cancelled = true;
    };
  }, [
    applyResumeMetadata,
    clearRemoteResumePreview,
    interviewerSessionId,
    isResumeUploading,
    resetResumeMetadata,
    setResumePreviewError,
  ]);

  const handleResumeFileSelect = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    event.target.value = "";
    setResumeUploadError(INTERVIEW_UPLOAD_DISABLED_MESSAGE);
    setResumePreviewError(INTERVIEW_UPLOAD_DISABLED_MESSAGE);
  };

  return {
    fileInputRef,
    resumeName,
    resumeFileUrl,
    resumeRemoteFile,
    resumeLocalFile,
    resumeScore,
    resumeInterviewType,
    resumeSuggestions,
    resumePreviewError,
    resumeUploadError,
    isResumeUploading,
    resumeUploadStage,
    numPages,
    isResumeOpen,
    setIsResumeOpen,
    resumePreviewSource,
    resumeOpenPreviewUrl,
    resolvedInterviewTypeLabel,
    handleResumePreviewLoadSuccess,
    handleResumePreviewLoadError,
    handleResumeFileSelect,
  };
}
