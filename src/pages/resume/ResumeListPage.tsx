import { ArrowRight, FilePlus2, Sparkles, Star, Upload } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

import {
  defaultResumeId,
  excellentResumeCards,
  optimizationOverview,
  resumeCards,
} from "./resumeMockData";
import { getResumeRouteSet, isPreviewResumePath } from "./resumeRouteUtils";

export default function ResumeListPage() {
  const location = useLocation();
  const routeSet = getResumeRouteSet(location.pathname);
  const isPreview = isPreviewResumePath(location.pathname);
  const optimizeHref = defaultResumeId
    ? `${routeSet.optimize}?id=${defaultResumeId}`
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
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">简历工作台</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                管理简历版本、补充目标岗位，并进入定向优化与模拟面试。
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
                value={String(resumeCards.length)}
                description="可继续编辑或定向优化的版本"
              />
              <MetricCard
                label="模板资产"
                value={String(excellentResumeCards.length)}
                description="可快速借鉴的参考模板"
              />
              <MetricCard
                label="最近得分"
                value={String(optimizationOverview.score)}
                description="最近一轮岗位匹配分析结果"
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
                description="先把本地简历接入工作台，再补充目标岗位。"
                to={routeSet.upload}
              />
              <QuickAction
                title="继续定向优化"
                description="围绕目标 JD 查看匹配度、缺口与建议改写。"
                to={optimizeHref}
              />
              <QuickAction
                title={isPreview ? "查看简历详情" : "进入模拟面试"}
                description={
                  isPreview
                    ? "在无登录预览路径中继续查看简历结构与内容层级。"
                    : "在简历优化后继续验证表达、项目叙述与岗位匹配。"
                }
                to={
                  isPreview
                    ? `${routeSet.detail}?id=${defaultResumeId}`
                    : ROUTES.interviewIntro
                }
              />
            </div>
          </aside>
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">我的简历</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                选择一个版本继续优化，或进入详情页查看当前表达结构。
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={routeSet.upload}>
                新建简历
                <FilePlus2 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {resumeCards.map((resume) => (
              <article
                key={resume.id}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{resume.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{resume.name}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {resume.updatedAt}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{resume.summary}</p>

                {resume.targetRole ? (
                  <p className="mt-4 text-sm text-slate-500">目标方向：{resume.targetRole}</p>
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
                    <Link to={`${routeSet.detail}?id=${resume.id}`}>查看详情</Link>
                  </Button>
                  <Button asChild className="rounded-full">
                    <Link to={`${routeSet.optimize}?id=${resume.id}`}>进入优化</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">参考模板</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              可作为结构借鉴，用来强化结果表达、岗位关键词与项目叙述。
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {excellentResumeCards.map((resume) => (
              <article
                key={resume.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                  <Star className="h-3.5 w-3.5" />
                  {resume.updatedAt}
                </div>
                <p className="mt-3 text-lg font-semibold text-slate-950">{resume.name}</p>
                <p className="mt-1 text-sm text-slate-500">{resume.title}</p>
                <p className="mt-4 text-sm leading-7 text-slate-600">{resume.summary}</p>
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
      <p className="text-xs font-medium tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
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
