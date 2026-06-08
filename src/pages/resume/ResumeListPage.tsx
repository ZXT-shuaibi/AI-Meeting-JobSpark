import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FilePlus2, Sparkles, Star, Upload } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { readCareerWorkspaceSnapshot } from "@/lib/careerWorkspaceStorage";
import {
  listCareerResumeVersions,
  type CareerResumeVersion,
} from "@/services/careerService";

import {
  buildResumeDetailPath,
  getResumeRouteSet,
  isPreviewResumePath,
} from "./resumeRouteUtils";

type ResumeCardViewModel = {
  id: string;
  name: string;
  title: string;
  summary: string;
  updatedAt: string;
  targetRole?: string;
  skills: string[];
};

const previewResumeCards: ResumeCardViewModel[] = [
  {
    id: "resume-01",
    name: "张潇童",
    title: "AI 产品与前端协同版简历",
    summary:
      "突出 AI 面试、简历优化与前端交付之间的完整链路，适合 AI 产品协同方向。",
    updatedAt: "2026-06-02 10:30",
    targetRole: "AI 产品 / 前端协同",
    skills: ["React", "TypeScript", "AI 应用", "交互设计"],
  },
  {
    id: "resume-02",
    name: "张潇童",
    title: "智能面试产品版简历",
    summary:
      "强调语音交互、面试训练与报告复盘能力，更适合智能面试与教育科技方向岗位。",
    updatedAt: "2026-05-28 18:10",
    targetRole: "智能面试产品",
    skills: ["LLM", "语音交互", "Node.js", "产品设计"],
  },
];

const previewTemplateCards: ResumeCardViewModel[] = [
  {
    id: "template-01",
    name: "结果导向型简历模板",
    title: "产品经理 / 策略分析",
    summary:
      "适合强化项目结果、指标提升与业务理解，便于快速对齐校招与实习岗位。",
    updatedAt: "精选模板",
    skills: ["结果表达", "业务拆解", "指标复盘"],
  },
  {
    id: "template-02",
    name: "AI 应用前端模板",
    title: "AI 前端 / 全栈应用",
    summary:
      "适合展示从用户场景到工程交付的完整闭环，强调 AI 能力如何真正落地。",
    updatedAt: "精选模板",
    skills: ["React", "AI Workflow", "产品闭环", "工程交付"],
  },
];

const truncateText = (value: string | null | undefined, maxLength = 84) => {
  const normalized = value?.replace(/\s+/g, " ").trim() || "";
  if (!normalized) {
    return "当前版本已接入真实简历数据，可继续查看详情或进入定向优化。";
  }
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized;
};

const formatResumeTime = (value: string | null) => {
  if (!value) {
    return "刚刚更新";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const mapResumeVersionToCard = (
  version: CareerResumeVersion,
): ResumeCardViewModel => ({
  id: version.id,
  name: "已上传简历",
  title: version.title || `简历版本 ${version.id}`,
  summary: truncateText(version.markdownContent || version.content),
  updatedAt: formatResumeTime(version.createTime),
  targetRole: version.title || undefined,
  skills: version.versionNo ? [`版本 ${version.versionNo}`] : [],
});

export default function ResumeListPage() {
  const location = useLocation();
  const routeSet = getResumeRouteSet(location.pathname);
  const isPreview = isPreviewResumePath(location.pathname);
  const workspace = useMemo(() => readCareerWorkspaceSnapshot(), []);
  const [resumeVersions, setResumeVersions] = useState<
    CareerResumeVersion[] | null
  >(() => (isPreview || !workspace.profileId ? [] : null));
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isPreview || !workspace.profileId) {
      return;
    }

    let cancelled = false;

    void listCareerResumeVersions(workspace.profileId)
      .then((versions) => {
        if (cancelled) {
          return;
        }
        setResumeVersions(versions);
        setLoadError(null);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setResumeVersions([]);
        setLoadError(
          error instanceof Error ? error.message : "Failed to load resumes",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isPreview, workspace.profileId]);

  const displayedResumes = useMemo(
    () =>
      isPreview
        ? previewResumeCards
        : (resumeVersions ?? []).map((item) => mapResumeVersionToCard(item)),
    [isPreview, resumeVersions],
  );
  const currentResumeId =
    workspace.resumeVersionId || displayedResumes[0]?.id || null;
  const optimizeHref = currentResumeId
    ? `${routeSet.optimize}?id=${currentResumeId}`
    : routeSet.optimize;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              Resume Workspace
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                简历工作台
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                管理简历版本、补充目标岗位，并继续进入定向优化与模拟面试。
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link to={routeSet.upload}>
                  上传新简历
                  <Upload className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to={optimizeHref}>
                  继续优化
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="当前简历"
                value={String(displayedResumes.length)}
                description="可继续编辑或定向优化的版本数量。"
              />
              <MetricCard
                label="主链路状态"
                value={
                  isPreview ? "预览" : workspace.profileId ? "已接入" : "待上传"
                }
                description="/career 页面已按 workspace 上下文加载真实简历版本。"
              />
              <MetricCard
                label="下一步动作"
                value={currentResumeId ? "优化" : "上传"}
                description="先上传简历，再进入 JD 对齐和模拟面试。"
              />
            </div>
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Star className="h-4 w-4 text-amber-500" />
              推荐路径
            </div>
            <div className="mt-5 space-y-3">
              <QuickAction
                title="导入现有简历"
                description="先把本地简历接入工作台，再继续后续优化和面试链路。"
                to={routeSet.upload}
              />
              <QuickAction
                title="继续定向优化"
                description="围绕目标 JD 查看匹配度、缺口和 AI 改写建议。"
                to={optimizeHref}
              />
              <QuickAction
                title={isPreview ? "查看简历详情" : "进入模拟面试"}
                description={
                  isPreview
                    ? "预览路径继续查看样例简历详情和页面跳转。"
                    : "简历和 JD 准备好后，继续验证表达、项目叙述和岗位匹配。"
                }
                to={
                  isPreview && currentResumeId
                    ? buildResumeDetailPath(routeSet.detail, currentResumeId)
                    : ROUTES.interviewIntro
                }
              />
            </div>
          </aside>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                我的简历
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                选择一个版本继续优化，或进入详情页查看当前内容和表达结构。
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={routeSet.upload}>
                新建简历
                <FilePlus2 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {loadError ? (
            <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {!isPreview && !workspace.profileId && !loadError ? (
            <EmptyWorkspaceCard />
          ) : null}

          {!isPreview && workspace.profileId && resumeVersions === null ? (
            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              正在加载真实简历版本...
            </div>
          ) : null}

          {displayedResumes.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {displayedResumes.map((resume) => (
                <article
                  key={resume.id}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-950">
                        {resume.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {resume.name}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {resume.updatedAt}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {resume.summary}
                  </p>

                  {resume.targetRole ? (
                    <p className="mt-4 text-sm text-slate-500">
                      目标方向：{resume.targetRole}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {resume.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="rounded-full">
                      <Link
                        to={buildResumeDetailPath(routeSet.detail, resume.id)}
                      >
                        查看详情
                      </Link>
                    </Button>
                    <Button asChild className="rounded-full">
                      <Link to={`${routeSet.optimize}?id=${resume.id}`}>
                        进入优化
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mt-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              参考模板
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              保留 AI-Meeting
              风格的静态模板参考，帮助我们快速校准内容结构和表达方式。
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {previewTemplateCards.map((resume) => (
              <article
                key={resume.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                  <Star className="h-3.5 w-3.5" />
                  {resume.updatedAt}
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  {resume.name}
                </p>
                <p className="mt-1 text-sm text-slate-500">{resume.title}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {resume.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {resume.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-[22px] border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}

function EmptyWorkspaceCard() {
  return (
    <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8">
      <p className="text-lg font-semibold text-slate-900">还没有真实简历版本</p>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
        当前主链路会根据最近一次上传得到的 profileId 拉取真实简历版本。
        先上传一份简历，我们就可以继续对齐 HireSpark 的优化和面试流程。
      </p>
    </div>
  );
}
