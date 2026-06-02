import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/constants";
import {
  buildResumeDetailPath,
  getResumeRouteSet,
  getResumeVersionIdFromRoute,
} from "@/pages/resume/resumeRouteUtils";

describe("resumeRouteUtils", () => {
  it("builds the main resume detail path without leaving the :resumeVersionId placeholder", () => {
    const routeSet = getResumeRouteSet("/career");

    expect(buildResumeDetailPath(routeSet.detail, "resume-42")).toBe(
      "/career/resumes/resume-42",
    );
    expect(buildResumeDetailPath(routeSet.detail, "resume-42")).not.toContain(
      ":resumeVersionId",
    );
  });

  it("keeps preview resume detail links on the preview route family", () => {
    const routeSet = getResumeRouteSet(ROUTES.previewResumeList);

    expect(buildResumeDetailPath(routeSet.detail, "resume-42")).toBe(
      "/preview/resume/detail?id=resume-42",
    );
  });

  it("reads the resumeVersionId from the main route pathname before falling back to query", () => {
    expect(
      getResumeVersionIdFromRoute({
        pathname: "/career/resumes/resume-99",
        params: {
          resumeVersionId: "resume-99",
        },
        search: "?id=resume-01",
      }),
    ).toBe("resume-99");
  });
});
