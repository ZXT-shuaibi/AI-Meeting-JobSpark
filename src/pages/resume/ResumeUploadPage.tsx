import { useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, FileText, UploadCloud } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { uploadCareerResume } from "@/services/careerService";

import { defaultResumeId, uploadGuidance } from "./resumeMockData";
import {
  buildResumeDetailPath,
  getResumeRouteSet,
  isPreviewResumePath,
} from "./resumeRouteUtils";

export default function ResumeUploadPage() {
  const location = useLocation();
  const routeSet = getResumeRouteSet(location.pathname);
  const isPreview = isPreviewResumePath(location.pathname);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResumeVersionId, setUploadedResumeVersionId] = useState<
    string | null
  >(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const isUploadingRef = useRef(false);

  const optimizeResumeId =
    uploadedResumeVersionId || (isPreview ? defaultResumeId : null);
  const optimizeHref = optimizeResumeId
    ? `${routeSet.optimize}?id=${optimizeResumeId}`
    : routeSet.optimize;
  const detailHref = uploadedResumeVersionId
    ? buildResumeDetailPath(routeSet.detail, uploadedResumeVersionId)
    : null;

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (isUploadingRef.current) {
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    setUploadError(null);
    setUploadedResumeVersionId(null);
    setUploadStatus(null);

    try {
      const result = await uploadCareerResume(file);
      setUploadedResumeVersionId(result.resumeVersionId);
      setUploadStatus(result.status);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Failed to upload resume",
      );
      setUploadedResumeVersionId(null);
      setUploadStatus(null);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
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

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.04fr_0.96fr]">
          <section className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
                STEP 1 / IMPORT
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                导入简历
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-500">
                上传
                PDF，或在下一步直接粘贴正文，系统会把内容带入简历优化工作台。
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
                <p
                  id="resume-upload-help"
                  className="mt-3 max-w-xl text-sm leading-7 text-slate-500"
                >
                  当前页面已经接入真实上传入口，联调阶段会继续补齐解析进度与版本识别反馈。
                </p>

                <input
                  id="resume-upload-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.md,.markdown,.txt,application/pdf"
                  className="sr-only"
                  aria-label="选择简历文件"
                  aria-describedby="resume-upload-help"
                  disabled={isUploading}
                  onChange={(event) => {
                    void handleFileSelect(event);
                  }}
                />

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="resume-upload-input"
                    className={`inline-flex items-center rounded-full px-5 py-2 text-sm font-medium text-white transition ${
                      isUploading
                        ? "cursor-not-allowed bg-slate-400"
                        : "cursor-pointer bg-slate-950 hover:bg-slate-800"
                    }`}
                  >
                    {isUploading ? "上传中..." : "选择简历文件"}
                  </label>
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

            {uploadError ? (
              <div className="rounded-[30px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
                {uploadError}
              </div>
            ) : null}

            {uploadedResumeVersionId ? (
              <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-sm font-semibold text-emerald-900">
                  已完成真实上传
                </p>
                <p className="mt-3 text-sm text-emerald-800">
                  简历版本 ID：
                  <code className="ml-1 rounded bg-white/70 px-2 py-0.5 font-mono text-xs">
                    {uploadedResumeVersionId}
                  </code>
                </p>
                <p className="mt-2 text-sm text-emerald-700">
                  解析状态：{uploadStatus || "UNKNOWN"}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {detailHref ? (
                    <Button asChild variant="outline" className="rounded-full">
                      <Link to={detailHref}>查看详情</Link>
                    </Button>
                  ) : null}
                  <Button asChild className="rounded-full">
                    <Link
                      to={`${routeSet.optimize}?id=${uploadedResumeVersionId}`}
                    >
                      进入定向优化
                    </Link>
                  </Button>
                </div>
              </div>
            ) : null}
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
      <p className="text-xs font-medium tracking-[0.18em] text-slate-400">
        {step}
      </p>
      <p className="mt-3 text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
