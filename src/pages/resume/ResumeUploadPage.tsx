import { ArrowLeft, ArrowRight, FileText, UploadCloud } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { defaultResumeId, uploadGuidance } from "./resumeMockData";
import { getResumeRouteSet } from "./resumeRouteUtils";

export default function ResumeUploadPage() {
  const location = useLocation();
  const routeSet = getResumeRouteSet(location.pathname);
  const optimizeHref = defaultResumeId
    ? `${routeSet.optimize}?id=${defaultResumeId}`
    : routeSet.optimize;

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Button asChild variant="ghost" className="rounded-full px-3 text-slate-500">
          <Link to={routeSet.list}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回简历列表
          </Link>
        </Button>

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.04fr_0.96fr]">
          <section className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-[0.18em] text-slate-400">STEP 1 / IMPORT</p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">导入简历</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                上传 PDF，或在下一步直接粘贴正文，系统会把内容带入简历优化工作台。
              </p>
            </div>

            <div className="rounded-[32px] border border-dashed border-slate-300 bg-slate-50 px-8 py-12">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                  <UploadCloud className="h-9 w-9 text-slate-400" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-slate-900">
                  点击或拖拽文件到此处
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  当前静态稿先保留导入入口，联调阶段会接入真实解析与版本识别能力。
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                    PDF
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                    最大 5MB
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StepCard
                step="01"
                title="上传原始文件"
                description="从本地导入现有版本，作为后续优化的基础。"
              />
              <StepCard
                step="02"
                title="确认目标岗位"
                description="在下一步补充岗位链接和 JD 描述。"
              />
              <StepCard
                step="03"
                title="进入定向优化"
                description="围绕本轮投递生成匹配度、缺口与改写建议。"
              />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-sky-500" />
                后续会带入什么
              </div>
              <div className="mt-5 space-y-3">
                {uploadGuidance.map((item) => (
                  <div
                    key={item}
                    className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">下一步</p>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                进入定向优化工作台后，可以继续补充简历正文、岗位链接和目标 JD。
              </p>

              <Button asChild className="mt-6 w-full rounded-full">
                <Link to={optimizeHref}>
                  进入定向优化
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium tracking-[0.18em] text-slate-400">{step}</p>
      <p className="mt-3 text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
