import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  getCareerResumeVersion,
  type CareerResumeVersion,
} from "@/services/careerService";

import { resumeDetails } from "./resumeMockData";
import {
  getResumeRouteSet,
  getResumeVersionIdFromRoute,
  isPreviewResumePath,
} from "./resumeRouteUtils";

type ResumeDetailViewModel = {
  id: string;
  name: string;
  title: string;
  contactLine: string;
  summary: string;
  skills: string[];
  targetRole: string;
  rawText: string;
  experiences: Array<{
    company: string;
    role: string;
    period: string;
    highlights: string[];
  }>;
  projects: Array<{
    name: string;
    role: string;
    period: string;
    highlights: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    period: string;
  }>;
};

const buildServiceResumeViewModel = (
  resumeVersion: CareerResumeVersion,
): ResumeDetailViewModel => {
  const content = resumeVersion.markdownContent || resumeVersion.content || "";
  return {
    id: resumeVersion.id,
    name: "已上传简历",
    title: resumeVersion.title || `简历版本 ${resumeVersion.id}`,
    contactLine: `resumeVersionId: ${resumeVersion.id}`,
    summary: content || "当前版本正在等待进一步补全与结构化。",
    skills: [],
    targetRole: "待补充目标方向",
    rawText: content,
    experiences: [],
    projects: [],
    education: [],
  };
};

const buildPendingServiceResumeViewModel = (
  resumeVersionId: string,
): ResumeDetailViewModel => ({
  id: resumeVersionId,
  name: "已上传简历",
  title: `简历版本 ${resumeVersionId}`,
  contactLine: `resumeVersionId: ${resumeVersionId}`,
  summary: "当前版本暂未返回结构化内容，请稍后重试。",
  skills: [],
  targetRole: "待补充目标方向",
  rawText: "",
  experiences: [],
  projects: [],
  education: [],
});

export default function ResumeDetailPage() {
  const location = useLocation();
  const params = useParams<{ resumeVersionId?: string }>();
  const routeSet = getResumeRouteSet(location.pathname);
  const isPreview = isPreviewResumePath(location.pathname);
  const currentId = getResumeVersionIdFromRoute({
    pathname: location.pathname,
    params,
    search: location.search,
  });
  const mockResume = isPreview
    ? (resumeDetails.find((item) => item.id === currentId) ?? null)
    : null;
  const [resumeVersion, setResumeVersion] =
    useState<CareerResumeVersion | null>(null);
  const [resumeLoadError, setResumeLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentId) {
      return;
    }

    let cancelled = false;
    void getCareerResumeVersion(currentId)
      .then((result) => {
        if (!cancelled) {
          setResumeVersion(result.id ? result : null);
          setResumeLoadError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setResumeVersion(null);
          setResumeLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load resume version",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentId]);

  const resume = useMemo(() => {
    if (!currentId) {
      return null;
    }
    if (resumeVersion?.id === currentId) {
      return buildServiceResumeViewModel(resumeVersion);
    }
    if (mockResume) {
      return mockResume;
    }
    return buildPendingServiceResumeViewModel(currentId);
  }, [currentId, mockResume, resumeVersion]);

  if (!resume) {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium tracking-[0.16em] text-slate-400">
              简历上下文缺失
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              这个入口需要先选择一份简历
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              请先返回简历列表重新选择，再进入详情页或定向优化工作台。
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link to={routeSet.list}>返回简历列表</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          <Button asChild className="rounded-full">
            <Link to={`${routeSet.optimize}?id=${resume.id}`}>
              继续优化
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <aside className="space-y-4">
            {resumeLoadError ? (
              <div className="rounded-[30px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                {resumeLoadError}
              </div>
            ) : null}

            <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-3xl font-semibold tracking-tight text-slate-950">
                {resume.name}
              </p>
              <p className="mt-2 text-base text-slate-600">{resume.title}</p>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                {resume.contactLine}
              </p>
              <div className="mt-4 rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                目标方向：{resume.targetRole}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">个人摘要</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {resume.summary}
              </p>
            </div>

            {resume.skills.length > 0 ? (
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">核心能力</p>
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
              </div>
            ) : null}

            {resume.rawText ? (
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">原始正文</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {resume.rawText}
                </pre>
              </div>
            ) : null}
          </aside>

          <section className="space-y-6">
            <SectionBlock title="工作经历">
              {resume.experiences.length > 0 ? (
                resume.experiences.map((item) => (
                  <ResumeItem
                    key={`${item.company}-${item.role}`}
                    title={`${item.company} / ${item.role}`}
                    period={item.period}
                    highlights={item.highlights}
                  />
                ))
              ) : (
                <EmptyState description="当前真实版本还没有映射成结构化工作经历，后续可以继续补齐。" />
              )}
            </SectionBlock>

            <SectionBlock title="项目经历">
              {resume.projects.length > 0 ? (
                resume.projects.map((item) => (
                  <ResumeItem
                    key={`${item.name}-${item.role}`}
                    title={`${item.name} / ${item.role}`}
                    period={item.period}
                    highlights={item.highlights}
                  />
                ))
              ) : (
                <EmptyState description="当前真实版本还没有映射成结构化项目经历，后续可以继续补齐。" />
              )}
            </SectionBlock>

            <SectionBlock title="教育背景">
              {resume.education.length > 0 ? (
                resume.education.map((item) => (
                  <div
                    key={`${item.school}-${item.period}`}
                    className="rounded-[24px] border border-slate-200 bg-white p-5"
                  >
                    <p className="text-base font-semibold text-slate-900">
                      {item.school}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{item.degree}</p>
                    <p className="mt-2 text-sm text-slate-400">{item.period}</p>
                  </div>
                ))
              ) : (
                <EmptyState description="当前真实版本还没有映射成结构化教育背景，后续可以继续补齐。" />
              )}
            </SectionBlock>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
      <p className="text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function ResumeItem({
  title,
  period,
  highlights,
}: {
  title: string;
  period: string;
  highlights: string[];
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        <span className="text-sm text-slate-400">{period}</span>
      </div>

      <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
        {highlights.map((highlight) => (
          <li key={highlight} className="rounded-[18px] bg-slate-50 px-4 py-3">
            {highlight}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ description }: { description: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-5 py-4 text-sm leading-6 text-slate-500">
      {description}
    </div>
  );
}
