import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InterviewReportHeader from "@/components/interview/report/InterviewReportHeader";
import InterviewScoreAndRadarCard from "@/components/interview/report/InterviewScoreAndRadarCard";
import InterviewConclusionCard from "@/components/interview/report/InterviewConclusionCard";
import InterviewNextActionsCard from "@/components/interview/report/InterviewNextActionsCard";
import InterviewQaReplayCard from "@/components/interview/report/InterviewQaReplayCard";
import { useInterviewReportData } from "@/hooks/interview/report/useInterviewReportData";
import { ROUTES } from "@/lib/constants";
import { getReportSessionIdFromLocation } from "@/lib/interviewReportRoute";

export default function InterviewReportPage() {
  const location = useLocation();
  const reportSessionId = getReportSessionIdFromLocation(location);

  const {
    isRecordLoading,
    recordError,
    resumeScore,
    interviewScore,
    compositeScore,
    isCompositeEstimated,
    radarPoints,
    sortedSuggestions,
    interviewDirection,
    qaReviews,
    reviewFeedback,
  } = useInterviewReportData(reportSessionId);

  const hasReportSession = Boolean(reportSessionId);

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <InterviewReportHeader />
        </motion.div>

        {!hasReportSession ? (
          <Card className="border-amber-100 bg-amber-50 p-6 text-amber-800">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">
                当前页不提供报告历史列表
              </h2>
              <p className="text-sm leading-7">
                HireSpark
                目前只支持按面试会话查看报告。请从已完成的面试会话进入报告页，或先回到工作台开始一次新的面试。
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button asChild className="rounded-full">
                  <Link to={ROUTES.career}>前往简历工作台</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to={ROUTES.interviewIntro}>前往 AI 面试</Link>
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {hasReportSession ? (
          <>
            <div className="grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.38,
                    delay: 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <InterviewScoreAndRadarCard
                    resumeScore={resumeScore}
                    interviewScore={interviewScore}
                    compositeScore={compositeScore}
                    isCompositeEstimated={isCompositeEstimated}
                    radarPoints={radarPoints}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    duration: 0.38,
                    delay: 0.12,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <InterviewNextActionsCard
                    reviewFeedback={reviewFeedback}
                    sortedSuggestions={sortedSuggestions}
                    isRecordLoading={isRecordLoading}
                    recordError={recordError}
                  />
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 18, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.38,
                  delay: 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <InterviewConclusionCard
                  interviewDirection={interviewDirection}
                  reviewFeedback={reviewFeedback}
                  isRecordLoading={isRecordLoading}
                  recordError={recordError}
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.4,
                delay: 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <InterviewQaReplayCard
                qaReviews={qaReviews}
                isRecordLoading={isRecordLoading}
                recordError={recordError}
              />
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  );
}
