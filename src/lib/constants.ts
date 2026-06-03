export const ROUTES = {
  home: "/",
  career: "/career",
  interviewIntro: "/career/interviews",
  interviewRoomEntry: "/career/interviews/room",
  interviewRoom: "/career/interviews/:sessionId",
  interviewReport: "/career/interview-reports",
  interviewReportDetail: "/career/interview-reports/:sessionId",
  chat: "/chat",
  resumeList: "/career",
  resumeUpload: "/career/resumes/upload",
  resumeOptimize: "/career/optimizations",
  resumeDetail: "/career/resumes/:resumeVersionId",
  questionBank: "/question-bank",
  questionBankManage: "/question-bank/manage",
  auth: "/auth",
  previewResumeList: "/preview/resume/list",
  previewResumeUpload: "/preview/resume/upload",
  previewResumeOptimize: "/preview/resume/optimize",
  previewResumeDetail: "/preview/resume/detail",
} as const;

export const buildInterviewRoomPath = (sessionId: string) =>
  ROUTES.interviewRoom.replace(":sessionId", encodeURIComponent(sessionId));

export const CHAT_ROLES = {
  user: "user",
  assistant: "assistant",
} as const;

export type ChatRole = (typeof CHAT_ROLES)[keyof typeof CHAT_ROLES];

export const INTERVIEW_DEFAULTS = {
  initialMessageId: "1",
  assistantWelcomeMessage:
    "\u4f60\u597d\uff0c\u6211\u662f\u4f60\u7684 AI \u9762\u8bd5\u5b98\u3002\u8bf7\u5148\u4e0a\u4f20\u7b80\u5386\uff0c\u6211\u4eec\u5f00\u59cb\u4eca\u5929\u7684\u6a21\u62df\u9762\u8bd5\u3002",
  assistantFollowupMessage:
    "\u6536\u5230\u4f60\u7684\u56de\u7b54\u3002\u8fd9\u662f\u4e00\u4e2a\u4e0d\u9519\u7684\u5207\u5165\u70b9\uff0c\u4f60\u53ef\u4ee5\u518d\u5177\u4f53\u8bf4\u8bf4\u5f53\u65f6\u7684\u601d\u8def\u3001\u5206\u5de5\u548c\u5b9e\u9645\u7ed3\u679c\u5417\uff1f",
  aiReplyDelayMs: 1500,
  resumeAccept: ".pdf",
} as const;

export const MEDIA_TARGETS = {
  camera: "camera",
  microphone: "microphone",
} as const;

export type MediaTarget = (typeof MEDIA_TARGETS)[keyof typeof MEDIA_TARGETS];
