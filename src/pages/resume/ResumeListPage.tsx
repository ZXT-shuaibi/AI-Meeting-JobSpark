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
import {
  buildResumeDetailPath,
  getResumeRouteSet,
  isPreviewResumePath,
} from "./resumeRouteUtils";

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
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                绠€鍘嗗伐浣滃彴
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                绠＄悊绠€鍘嗙増鏈€佽ˉ鍏呯洰鏍囧矖浣嶏紝骞惰繘鍏ュ畾鍚戜紭鍖栦笌妯℃嫙闈㈣瘯銆?
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link to={routeSet.upload}>
                  涓婁紶鏂扮畝鍘?
                  <Upload className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to={optimizeHref}>
                  缁х画浼樺寲
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="褰撳墠绠€鍘?"
                value={String(resumeCards.length)}
                description="鍙户缁紪杈戞垨瀹氬悜浼樺寲鐨勭増鏈?"
              />
              <MetricCard
                label="妯℃澘璧勪骇"
                value={String(excellentResumeCards.length)}
                description="鍙揩閫熷€熼壌鐨勫弬鑰冩ā鏉?"
              />
              <MetricCard
                label="鏈€杩戝緱鍒?"
                value={String(optimizationOverview.score)}
                description="鏈€杩戜竴杞矖浣嶅尮閰嶅垎鏋愮粨鏋?"
              />
            </div>
          </section>

          <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Star className="h-4 w-4 text-amber-500" />
              鎺ㄨ崘璺緞
            </div>
            <div className="mt-5 space-y-3">
              <QuickAction
                title="瀵煎叆鐜版湁绠€鍘?"
                description="鍏堟妸鏈湴绠€鍘嗘帴鍏ュ伐浣滃彴锛屽啀琛ュ厖鐩爣宀椾綅銆?"
                to={routeSet.upload}
              />
              <QuickAction
                title="缁х画瀹氬悜浼樺寲"
                description="鍥寸粫鐩爣 JD 鏌ョ湅鍖归厤搴︺€佺己鍙ｄ笌寤鸿鏀瑰啓銆?"
                to={optimizeHref}
              />
              <QuickAction
                title={isPreview ? "鏌ョ湅绠€鍘嗚鎯?" : "杩涘叆妯℃嫙闈㈣瘯"}
                description={
                  isPreview
                    ? "鍦ㄦ棤鐧诲綍棰勮璺緞涓户缁煡鐪嬬畝鍘嗙粨鏋勪笌鍐呭灞傜骇銆?"
                    : "鍦ㄧ畝鍘嗕紭鍖栧悗缁х画楠岃瘉琛ㄨ揪銆侀」鐩彊杩颁笌宀椾綅鍖归厤銆?"
                }
                to={
                  isPreview
                    ? buildResumeDetailPath(routeSet.detail, defaultResumeId)
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
                鎴戠殑绠€鍘?
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                閫夋嫨涓€涓増鏈户缁紭鍖栵紝鎴栬繘鍏ヨ鎯呴〉鏌ョ湅褰撳墠琛ㄨ揪缁撴瀯銆?
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to={routeSet.upload}>
                鏂板缓绠€鍘?
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
                    <p className="text-lg font-semibold text-slate-950">
                      {resume.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{resume.name}</p>
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
                    {`目标方向：${resume.targetRole}`}
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
                      鏌ョ湅璇︽儏
                    </Link>
                  </Button>
                  <Button asChild className="rounded-full">
                    <Link to={`${routeSet.optimize}?id=${resume.id}`}>
                      杩涘叆浼樺寲
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              鍙傝€冩ā鏉?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              鍙綔涓虹粨鏋勫€熼壌锛岀敤鏉ュ己鍖栫粨鏋滆〃杈俱€佸矖浣嶅叧閿瘝涓庨」鐩彊杩般€?
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
