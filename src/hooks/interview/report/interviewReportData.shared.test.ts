import { describe, expect, it } from "vitest";

import { buildInterviewReportViewModel } from "@/hooks/interview/report/interviewReportData.shared";
import type { CareerInterviewReport } from "@/services/careerService";

describe("interviewReportData.shared", () => {
  it("extracts resume and interview scores from Chinese HireSpark report labels", () => {
    const viewModel = buildInterviewReportViewModel({
      id: "report-1",
      sessionId: "session-1",
      overallScore: 88,
      summary: "整体发挥稳定",
      radar: [
        { dimension: "简历匹配度", score: 84 },
        { dimension: "沟通表达", score: 91 },
      ],
      playback: [
        {
          question: "请介绍你的项目经验",
          answer: "我负责主导交付",
          score: 90,
          feedback: {
            strengths: ["表达清晰"],
            missingPoints: ["量化结果不足"],
          },
        },
      ],
      suggestions: [
        {
          title: "补充量化结果",
          action: "增加业务指标与上线效果",
        },
      ],
      traceId: "trace-1",
      createTime: "2026-06-07T00:00:00Z",
    } satisfies CareerInterviewReport);

    expect(viewModel.resumeScore).toBe(84);
    expect(viewModel.interviewScore).toBe(90);
    expect(viewModel.compositeScore).toBe(88);
    expect(viewModel.reviewFeedback.highlights).toEqual(["表达清晰"]);
    expect(viewModel.reviewFeedback.improvementTips).toEqual(["量化结果不足"]);
  });
});
