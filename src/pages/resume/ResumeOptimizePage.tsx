import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Link2, Sparkles, UploadCloud } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";

import {
  defaultResumeId,
  optimizationInsightGroups,
  optimizationOverview,
  optimizeWorkspaceDraft,
  optimizedResumePreview,
  resumeDetails,
} from "./resumeMockData";
import { getResumeRouteSet } from "./resumeRouteUtils";

export default function ResumeOptimizePage() {
  const location = useLocation();
  const routeSet = getResumeRouteSet(location.pathname);
  const [searchParams] = useSearchParams();
  const currentId = searchParams.get("id");
  const resume = resumeDetails.find((item) => item.id === currentId);

  if (!resume) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium tracking-[0.16em] text-slate-400">优化上下文缺失</p>
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
              {defaultResumeId ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link to={`${routeSet.optimize}?id=${defaultResumeId}`}>查看示例工作台</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" className="rounded-full px-3 text-slate-500">
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
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">简历定向优化</h1>
            <p className="text-base leading-7 text-slate-500">
              先确认简历内容，再补充目标 JD，让优化建议直接围绕这一次投递展开。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <InfoPill label="当前简历" value={resume.title} />
            <InfoPill label="目标方向" value={resume.targetRole} />
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
                已载入 {resume.title}
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
                defaultValue={optimizeWorkspaceDraft.resumeText}
                className="min-h-[320px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-300"
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">本轮优化关注点</p>
              <div className="flex flex-wrap gap-2">
                {optimizeWorkspaceDraft.focusTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel
            eyebrow="目标岗位"
            title="JD 输入"
            subtitle="支持招聘链接和岗位描述双输入，便于后续映射关键词与要求。"
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
                  defaultValue={optimizeWorkspaceDraft.jdLink}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="jd-content" className="text-sm font-semibold text-slate-900">
                岗位描述
              </label>
              <textarea
                id="jd-content"
                defaultValue={optimizeWorkspaceDraft.jdText}
                className="min-h-[248px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-slate-300"
              />
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">开始前检查</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                {optimizeWorkspaceDraft.quickChecklist.map((item) => (
                  <li key={item} className="rounded-[16px] bg-white px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </WorkspacePanel>
        </section>

        <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-slate-900">岗位匹配判断</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {optimizationOverview.matchSummary}
              </p>
            </div>
            <Button className="rounded-full px-5">
              开始优化
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.74fr_1.26fr]">
            <div className="space-y-4">
              <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                <p className="text-xs font-medium tracking-[0.18em] text-slate-400">MATCH SCORE</p>
                <p className="mt-4 text-5xl font-semibold tracking-tight">
                  {optimizationOverview.score}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  当前版本已具备较强的岗位匹配基础，可进一步强化结果表达与 AI 能力拆解。
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">评分演进</p>
                <div className="mt-4 space-y-3">
                  {optimizationOverview.history.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-white px-4 py-3"
                    >
                      <span className="text-sm text-slate-600">{item.label}</span>
                      <span className="text-sm font-semibold text-slate-900">{item.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {optimizationInsightGroups.map((group) => (
                <ResultGroup key={group.title} title={group.title} items={group.items} />
              ))}

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">优化后摘要预览</p>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                  {optimizedResumePreview.map((item) => (
                    <li key={item} className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
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
      <p className="text-xs font-medium tracking-[0.16em] text-slate-400">{eyebrow}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{title}</p>
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
          <li key={item} className="rounded-[18px] border border-slate-200 bg-white px-4 py-3">
            {item}
          </li>
        ))}
      </ul>
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
