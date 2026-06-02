import { describe, expect, it } from "vitest";
import {
  mapCareerInterviewSession,
  mapCareerOptimizationTask,
  mapCareerResumeUpload,
} from "@/adapters/hirespark/careerAdapter";

describe("careerAdapter", () => {
  it("maps resume upload payload into a frontend-safe model with status", () => {
    expect(
      mapCareerResumeUpload({
        documentId: "doc-123",
        profileId: "profile-456",
        resumeVersionId: "resume-789",
        parseStatus: "parsed",
      }),
    ).toEqual({
      documentId: "doc-123",
      profileId: "profile-456",
      resumeVersionId: "resume-789",
      status: "parsed",
    });
  });

  it("maps optimization task payload with safe defaults", () => {
    expect(
      mapCareerOptimizationTask({
        id: "task-1",
      }),
    ).toEqual({
      id: "task-1",
      status: "pending",
      qualityScore: null,
      suggestions: [],
    });
  });

  it("maps interview session payload with safe defaults", () => {
    expect(
      mapCareerInterviewSession({
        id: "session-1",
      }),
    ).toEqual({
      id: "session-1",
      status: "pending",
      currentTurnNo: 0,
      currentQuestion: null,
    });
  });
});
