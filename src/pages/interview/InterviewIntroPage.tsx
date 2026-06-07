import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { isStaticPreviewEnabled } from "@/config/env";
import { ROUTES } from "@/lib/constants";
import InterviewIntroHighlights from "@/components/interview/intro/InterviewIntroHighlights";
import InterviewIntroStepsCard from "@/components/interview/intro/InterviewIntroStepsCard";
import {
  DEFAULT_INTERVIEW_INTRO_LOCALE,
  getInterviewIntroCopy,
} from "@/components/interview/intro/introCopy";

export default function InterviewIntroPage() {
  const introCopy = useMemo(
    () => getInterviewIntroCopy(DEFAULT_INTERVIEW_INTRO_LOCALE),
    [],
  );
  const showSampleReportEntry = isStaticPreviewEnabled();

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
              <Sparkles className="h-3.5 w-3.5" />
              {introCopy.badge}
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
                {introCopy.title}
              </h1>
              <p className="text-lg text-slate-500">{introCopy.description}</p>
            </div>

            <InterviewIntroHighlights highlights={introCopy.highlights} />

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full">
                <Link to={ROUTES.career}>
                  {introCopy.startButton}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {showSampleReportEntry ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link to={ROUTES.interviewReport}>
                    {introCopy.reportButton}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <InterviewIntroStepsCard
            title={introCopy.processTitle}
            steps={introCopy.steps}
            updateTitle={introCopy.processUpdateTitle}
            updateDescription={introCopy.processUpdateDescription}
            sampleRadarTitle={introCopy.sampleRadarTitle}
            mockRadarPoints={introCopy.mockRadarPoints}
          />
        </div>
      </div>
    </div>
  );
}
