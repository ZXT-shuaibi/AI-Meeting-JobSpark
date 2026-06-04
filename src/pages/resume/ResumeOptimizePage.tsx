import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Link2,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  createCareerOptimization,
  createCareerOptimizationProgressStream,
  getCareerOptimizationTask,
  getCareerResumeVersion,
  type CareerOptimizationTask,
  type CareerProgressEvent,
  type CareerProgressStreamHandle,
  type CareerResumeVersion,
} from "@/services/careerService";

import {
  defaultResumeId,
  optimizationInsightGroups,
  optimizationOverview,
  optimizeWorkspaceDraft,
  optimizedResumePreview,
  resumeDetails,
} from "./resumeMockData";
import { getResumeRouteSet, isPreviewResumePath } from "./resumeRouteUtils";

export default function ResumeOptimizePage() {
  const location = useLocation();
  const routeSet = getResumeRouteSet(location.pathname);
  const isPreview = isPreviewResumePath(location.pathname);
  const [searchParams] = useSearchParams();
  const currentId = searchParams.get("id");

  if (!currentId) {
    return (
      <MissingResumeContext
        routeSet={routeSet}
        showSampleAction={isPreview && Boolean(defaultResumeId)}
      />
    );
  }

  return (
    <ResumeOptimizeWorkspace
      key={`${location.pathname}:${currentId}`}
      currentId={currentId}
      isPreview={isPreview}
      routeSet={routeSet}
    />
  );
}

function ResumeOptimizeWorkspace({
  currentId,
  isPreview,
  routeSet,
}: {
  currentId: string;
  isPreview: boolean;
  routeSet: ReturnType<typeof getResumeRouteSet>;
}) {
  const mockResume = isPreview
    ? (resumeDetails.find((item) => item.id === currentId) ?? null)
    : null;
  const [resumeVersion, setResumeVersion] =
    useState<CareerResumeVersion | null>(null);
  const [resumeLoadError, setResumeLoadError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [jdLink, setJdLink] = useState(
    isPreview ? optimizeWorkspaceDraft.jdLink : "",
  );
  const [jdText, setJdText] = useState(
    isPreview ? optimizeWorkspaceDraft.jdText : "",
  );
  const [isCreatingOptimization, setIsCreatingOptimization] = useState(false);
  const [optimizationError, setOptimizationError] = useState<string | null>(
    null,
  );
  const [optimizationTask, setOptimizationTask] =
    useState<CareerOptimizationTask | null>(null);
  const [optimizationScopeId, setOptimizationScopeId] = useState<string | null>(
    null,
  );
  const [latestProgressMessage, setLatestProgressMessage] = useState<
    string | null
  >(null);
  const progressStreamRef = useRef<CareerProgressStreamHandle | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResumeLoadError(null);

    void getCareerResumeVersion(currentId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setResumeVersion(result);
        setResumeText(result.markdownContent || result.content || "");
        setResumeLoadError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setResumeVersion(null);
        setResumeLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load resume version",
        );
        setResumeText(
          isPreview
            ? mockResume?.rawText || optimizeWorkspaceDraft.resumeText
            : "",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [currentId, isPreview, mockResume?.rawText]);

  useEffect(() => {
    if (resumeVersion || resumeText || !isPreview) {
      return;
    }
    if (mockResume?.rawText) {
      setResumeText(mockResume.rawText);
      return;
    }
    if (currentId === defaultResumeId) {
      setResumeText(optimizeWorkspaceDraft.resumeText);
    }
  }, [currentId, isPreview, mockResume?.rawText, resumeText, resumeVersion]);

  useEffect(() => {
    return () => {
      progressStreamRef.current?.close();
      progressStreamRef.current = null;
    };
  }, []);

  const scopedOptimizationTask =
    optimizationScopeId === currentId ? optimizationTask : null;
  const scopedOptimizationError =
    optimizationScopeId === currentId ? optimizationError : null;
  const scopedLatestProgressMessage =
    optimizationScopeId === currentId ? latestProgressMessage : null;

  const resolvedResumeId = resumeVersion?.id || mockResume?.id || currentId;
  const resolvedResumeTitle =
    resumeVersion?.title ||
    (isPreview ? mockResume?.title : null) ||
    "已上传简历版本";
  const resolvedTargetRole =
    (isPreview ? mockResume?.targetRole : null) || "待补充目标方向";
  const resolvedSuggestions = scopedOptimizationTask?.suggestions?.length
    ? scopedOptimizationTask.suggestions
    : [];
  const resolvedScore =
    scopedOptimizationTask?.qualityScore ??
    (isPreview ? optimizationOverview.score : null);
  const resolvedInsightGroups = isPreview ? optimizationInsightGroups : [];
  const resolvedPreviewItems = isPreview ? optimizedResumePreview : [];
  const resolvedFocusTags = isPreview ? optimizeWorkspaceDraft.focusTags : [];
  const resolvedChecklist = isPreview
    ? optimizeWorkspaceDraft.quickChecklist
    : [];
  const resolvedMatchSummary =
    scopedOptimizationTask?.summary ||
    (isPreview
      ? optimizationOverview.matchSummary
      : "创建优化任务后，这里会展示与岗位匹配相关的摘要结论。");
  const canStartOptimization = isPreview
    ? Boolean(resolvedResumeId)
    : Boolean(resumeVersion?.id) && !resumeLoadError;

  const infoPills = useMemo(
    () => [
      { label: "当前简历", value: resolvedResumeTitle },
      { label: "目标方向", value: resolvedTargetRole },
      { label: "resumeVersionId", value: resolvedResumeId || "-" },
    ],
    [resolvedResumeId, resolvedResumeTitle, resolvedTargetRole],
  );

  const handleStartOptimization = async () => {
    if (!canStartOptimization || !resolvedResumeId) {
      setOptimizationError("请先确认简历版本加载成功，再开始优化。");
      return;
    }

    progressStreamRef.current?.close();
    progressStreamRef.current = null;
    setOptimizationScopeId(currentId);
    setOptimizationTask(null);
    setOptimizationError(null);
    setLatestProgressMessage(null);
    setIsCreatingOptimization(true);

    try {
      const createdTask = await createCareerOptimization({
        resumeVersionId: resolvedResumeId,
        jdId: undefined,
        alignmentReportId: undefined,
      });
      setOptimizationTask(createdTask);

      const taskId = createdTask.id;
      if (!taskId) {
        return;
      }

      progressStreamRef.current = await createCareerOptimizationProgressStream(
        taskId,
        {
          onProgress: (event) => {
            setLatestProgressMessage(event.message || null);
            setOptimizationTask((previous) =>
              previous && previous.id === taskId
                ? {
                    ...previous,
                    progressEvents: appendProgressEvent(
                      previous.progressEvents,
                      event,
                    ),
                  }
                : previous,
            );
          },
          onDone: async (event) => {
            setLatestProgressMessage(event?.message || "优化完成");
            setOptimizationTask((previous) =>
              previous && event
                ? {
                    ...previous,
                    progressEvents: appendProgressEvent(
                      previous.progressEvents,
                      event,
                    ),
                  }
                : previous,
            );
            await refreshOptimizationTaskSnapshot(
              taskId,
              setOptimizationTask,
              setOptimizationError,
            );
          },
          onError: async (error) => {
            setOptimizationError(error.message);
            await refreshOptimizationTaskSnapshot(
              taskId,
              setOptimizationTask,
              setOptimizationError,
            );
          },
        },
      );
    } catch (error) {
      setOptimizationError(
        error instanceof Error
          ? error.message
          : "Failed to create optimization task",
      );
    } finally {
      setIsCreatingOptimization(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Button
          asChild
          variant="ghost"
          className="rounded-full px-3 text-slate-500"
        >
          <Link to={routeSet.list}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回简历列表
          </Link>
        </Button>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              Resume Workspace
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
              简历定向优化
            </h1>
            <p className="text-base leading-7 text-slate-500">
              先确认简历内容，再补充目标 JD，让优化建议直接围绕这一次投递展开。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {infoPills.map((item) => (
              <InfoPill
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </div>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <WorkspacePanel
            eyebrow="简历输入"
            title="简历内容"
            subtitle="上传原始简历，或直接粘贴当前版本正文。"
          >
            <div className="flex flex-wrap gap-3">
              <Link
                to={routeSet.upload}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                <UploadCloud className="h-4 w-4" />
                上传文件
              </Link>
              <span className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-500">
                已载入 {resolvedResumeTitle}
              </span>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="resume-content"
                className="text-sm font-semibold text-slate-900"
              >
                简历内容
              </label>
              <textarea
                id="resume-content"
                value={resumeText}
                onChange={(event) => setResumeText(event.target.value)}
                className="min-h-[320px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-300"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">
                本轮优化关注点
              </p>
              {resolvedFocusTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {resolvedFocusTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <EmptyResultState description="创建优化任务后，这里会汇总本轮优化的关注点。" />
              )}
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            eyebrow="目标岗位"
            title="JD 输入"
            subtitle="当前先保留岗位链接和描述录入，Task 6 只接 resumeVersionId 与优化任务主链路。"
          >
            <div className="space-y-2">
              <label
                htmlFor="target-job-link"
                className="text-sm font-semibold text-slate-900"
              >
                目标岗位链接
              </label>
              <div className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <Link2 className="h-4 w-4 text-slate-400" />
                <input
                  id="target-job-link"
                  value={jdLink}
                  onChange={(event) => setJdLink(event.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="jd-content"
                className="text-sm font-semibold text-slate-900"
              >
                岗位描述
              </label>
              <textarea
                id="jd-content"
                value={jdText}
                onChange={(event) => setJdText(event.target.value)}
                className="min-h-[248px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-300"
              />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">开始前检查</p>
              {resolvedChecklist.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  {resolvedChecklist.map((item) => (
                    <li
                      key={item}
                      className="rounded-[16px] bg-white px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyResultState description="补充真实简历与岗位信息后，就可以直接启动优化任务。" />
              )}
            </div>
          </WorkspacePanel>
        </section>

        <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-slate-900">
                岗位匹配判断
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {resolvedMatchSummary}
              </p>
            </div>
            <Button
              className="rounded-full px-5"
              disabled={isCreatingOptimization || !canStartOptimization}
              onClick={() => {
                void handleStartOptimization();
              }}
            >
              {isCreatingOptimization ? "创建中..." : "开始优化"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {resumeLoadError ? (
            <div className="mt-4 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {resumeLoadError}
            </div>
          ) : null}

          {scopedOptimizationError ? (
            <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {scopedOptimizationError}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.74fr_1.26fr]">
            <div className="space-y-4">
              <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
                  MATCH SCORE
                </p>
                <p className="mt-4 text-5xl font-semibold tracking-tight">
                  {resolvedScore == null ? "-" : String(resolvedScore)}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {scopedLatestProgressMessage ||
                    scopedOptimizationTask?.riskSummary ||
                    "当前版本已具备较强的岗位匹配基础，可进一步强化结果表达与 AI 能力拆解。"}
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">任务状态</p>
                <div className="mt-4 space-y-3">
                  <MetricRow
                    label="任务 ID"
                    value={scopedOptimizationTask?.id || "-"}
                  />
                  <MetricRow
                    label="任务状态"
                    value={scopedOptimizationTask?.status || "-"}
                  />
                  <MetricRow
                    label="质量分"
                    value={
                      scopedOptimizationTask?.qualityScore == null
                        ? "-"
                        : String(scopedOptimizationTask.qualityScore)
                    }
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">实时进度</p>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  {(scopedOptimizationTask?.progressEvents || []).map(
                    (event, index) => (
                      <li
                        key={`${event.eventType || "event"}-${index}`}
                        className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                      >
                        {event.message || event.eventType || "进行中"}
                      </li>
                    ),
                  )}
                  {scopedLatestProgressMessage &&
                  !(scopedOptimizationTask?.progressEvents || []).some(
                    (event) => event.message === scopedLatestProgressMessage,
                  ) ? (
                    <li className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                      {scopedLatestProgressMessage}
                    </li>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              {resolvedInsightGroups.map((group) => (
                <ResultGroup
                  key={group.title}
                  title={group.title}
                  items={group.items}
                />
              ))}

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  优化建议与结果
                </p>
                {resolvedSuggestions.length > 0 ? (
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    {resolvedSuggestions.map((item) => (
                      <li
                        key={item}
                        className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyResultState description="优化任务完成后，这里会展示改写建议和评估结果。" />
                )}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  优化后摘要预览
                </p>
                {resolvedPreviewItems.length > 0 ? (
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                    {resolvedPreviewItems.map((item) => (
                      <li
                        key={item}
                        className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyResultState description="生成优化结果后，这里会展示新的简历摘要预览。" />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MissingResumeContext({
  routeSet,
  showSampleAction,
}: {
  routeSet: ReturnType<typeof getResumeRouteSet>;
  showSampleAction: boolean;
}) {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium tracking-[0.16em] text-slate-400">
            优化上下文缺失
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            请先选择一份简历，再进入定向优化
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            这样可以确保简历版本、目标岗位和优化建议始终对应同一条投递路径。
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="rounded-full">
              <Link to={routeSet.list}>返回简历列表</Link>
            </Button>
            {showSampleAction ? (
              <Button asChild variant="outline" className="rounded-full">
                <Link to={`${routeSet.optimize}?id=${defaultResumeId}`}>
                  查看示例工作台
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function appendProgressEvent(
  events: CareerProgressEvent[] | undefined,
  nextEvent: CareerProgressEvent,
) {
  return [...(events || []), nextEvent];
}

function mergeOptimizationTask(
  previous: CareerOptimizationTask | null,
  nextTask: CareerOptimizationTask,
) {
  if (!previous) {
    return nextTask;
  }

  if ((nextTask.progressEvents?.length || 0) > 0) {
    return nextTask;
  }

  return {
    ...nextTask,
    progressEvents: previous.progressEvents || [],
  };
}

async function refreshOptimizationTaskSnapshot(
  taskId: string,
  setOptimizationTask: Dispatch<SetStateAction<CareerOptimizationTask | null>>,
  setOptimizationError: Dispatch<SetStateAction<string | null>>,
) {
  try {
    const refreshedTask = await getCareerOptimizationTask(taskId);
    setOptimizationTask((previous) =>
      mergeOptimizationTask(previous, refreshedTask),
    );
  } catch (error) {
    setOptimizationError(
      error instanceof Error
        ? error.message
        : "Failed to refresh optimization task",
    );
  }
}

function WorkspacePanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium tracking-[0.16em] text-slate-400">
        {eyebrow}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-500">{subtitle}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function ResultGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-[18px] border border-slate-200 bg-white px-4 py-3"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyResultState({ description }: { description: string }) {
  return (
    <div className="mt-4 rounded-[18px] border border-dashed border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-500">
      {description}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
      <span className="text-slate-400">{label}：</span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
