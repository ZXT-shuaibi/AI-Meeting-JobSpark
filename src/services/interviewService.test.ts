import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError, ErrorCode } from "@/lib/errors";

const {
  mockFinishCareerInterview,
  mockGetCareerInterview,
  mockGetCareerInterviewNextQuestion,
  mockSubmitCareerInterviewAnswer,
} = vi.hoisted(() => ({
  mockFinishCareerInterview: vi.fn(),
  mockGetCareerInterview: vi.fn(),
  mockGetCareerInterviewNextQuestion: vi.fn(),
  mockSubmitCareerInterviewAnswer: vi.fn(),
}));

vi.mock("@/lib/request", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  assertRequestAuthorized: vi.fn(),
  buildApiUrl: vi.fn((path: string) => path),
}));

vi.mock("@/services/careerService", () => ({
  finishCareerInterview: (...args: unknown[]) =>
    mockFinishCareerInterview(...args),
  getCareerInterview: (...args: unknown[]) => mockGetCareerInterview(...args),
  getCareerInterviewNextQuestion: (...args: unknown[]) =>
    mockGetCareerInterviewNextQuestion(...args),
  submitCareerInterviewAnswer: (...args: unknown[]) =>
    mockSubmitCareerInterviewAnswer(...args),
}));

import {
  type AnswerInterviewQuestionResult,
  interviewService,
  normalizeInterviewAnswer,
} from "@/services/interviewService";

describe("normalizeInterviewAnswer", () => {
  it("keeps isFollowUp and followUpNeeded independent", () => {
    const payload = {
      is_follow_up: false,
      follow_up_needed: true,
      next_question: "请说明缓存一致性方案",
      next_question_number: "1-F1",
      follow_up_count: "1",
      finished: false,
      isSuccess: true,
    } as unknown as AnswerInterviewQuestionResult;
    const normalized = normalizeInterviewAnswer(payload);

    expect(normalized.isFollowUp).toBe(false);
    expect(normalized.followUpNeeded).toBe(true);
    expect(normalized.nextQuestionNumber).toBe("1-F1");
    expect(normalized.followUpCount).toBe(1);
  });

  it("normalizes follow-up flags and score fields from mixed naming", () => {
    const payload = {
      isFollowUp: true,
      followUpNeeded: false,
      total_score: "88",
      score_comment: "回答结构清晰",
      next_question: "继续展开事务隔离级别的选择依据",
      next_question_number: "2-F2",
      follow_up_count: 2,
      finished: "false",
    } as unknown as AnswerInterviewQuestionResult;
    const normalized = normalizeInterviewAnswer(payload);

    expect(normalized.isFollowUp).toBe(true);
    expect(normalized.followUpNeeded).toBe(false);
    expect(normalized.totalScore).toBe(88);
    expect(normalized.feedback).toBe("回答结构清晰");
    expect(normalized.nextQuestionNumber).toBe("2-F2");
    expect(normalized.followUpCount).toBe(2);
    expect(normalized.finished).toBe(false);
  });
});

describe("interviewService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty questionNumber before request", async () => {
    const error = await interviewService
      .answerInterviewQuestion({
        sessionId: "session-1",
        questionNumber: "   ",
        answerContent: "answer",
      })
      .catch((caught) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(ErrorCode.CLIENT_VALIDATION_ERROR);
  });

  it("maps the main-chain current question from HireSpark session data", async () => {
    mockGetCareerInterview.mockResolvedValue({
      id: "session-1",
      status: "IN_PROGRESS",
      currentTurnNo: 3,
      currentQuestion: {
        turnNo: 3,
        turnType: "QUESTION",
        question: "Tell me about your latest frontend migration.",
      },
    });

    const result = await interviewService.getCurrentQuestion("session-1");

    expect(mockGetCareerInterview).toHaveBeenCalledWith("session-1");
    expect(result).toMatchObject({
      isSuccess: true,
      questionNumber: "3",
      questionContent: "Tell me about your latest frontend migration.",
      nextQuestion: "Tell me about your latest frontend migration.",
      nextQuestionNumber: "3",
      isFollowUp: false,
      finished: false,
    });
  });

  it("submits an answer through HireSpark and refreshes the next question from the session", async () => {
    mockSubmitCareerInterviewAnswer.mockResolvedValue({
      turnNo: 2,
      score: 86,
      feedback: {
        summary: "回答结构清晰",
        strengths: ["背景交代完整"],
        missingPoints: ["补充量化结果"],
      },
    });
    mockGetCareerInterview.mockResolvedValue({
      id: "session-1",
      status: "IN_PROGRESS",
      currentTurnNo: 3,
      currentQuestion: {
        turnNo: 3,
        turnType: "FOLLOW_UP",
        question: "What changed after you introduced the new architecture?",
      },
    });

    const result = await interviewService.answerInterviewQuestion({
      sessionId: "session-1",
      questionNumber: "2",
      answerContent:
        "I introduced a typed API layer and shared schema validation.",
      requestId: "req-1",
    });

    expect(mockSubmitCareerInterviewAnswer).toHaveBeenCalledWith("session-1", {
      turnNo: 2,
      answer: "I introduced a typed API layer and shared schema validation.",
      answerSource: "TEXT",
      answerSourceMeta: {
        requestId: "req-1",
      },
    });
    expect(mockGetCareerInterview).toHaveBeenCalledWith("session-1");
    expect(result).toMatchObject({
      isSuccess: true,
      questionNumber: "2",
      score: 86,
      feedback: "回答结构清晰",
      nextQuestion: "What changed after you introduced the new architecture?",
      nextQuestionNumber: "3",
      isFollowUp: true,
      followUpCount: 1,
      finished: false,
    });
    expect(result.missingPoints).toEqual(["补充量化结果"]);
  });

  it("finishes the main-chain interview session through HireSpark", async () => {
    mockFinishCareerInterview.mockResolvedValue(undefined);

    await interviewService.finishInterviewSession("session-9");

    expect(mockFinishCareerInterview).toHaveBeenCalledWith("session-9");
  });
});
