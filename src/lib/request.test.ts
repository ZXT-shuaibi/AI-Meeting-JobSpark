import type { AxiosError } from "axios";
import { describe, expect, it, vi } from "vitest";
import { getAuthToken } from "@/lib/authToken";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  assertRequestAuthorized,
  buildRequestPolicyKey,
  buildApiUrl,
  mapAxiosErrorToAppError,
  requiresAuthTokenForRequest,
  resolveRequestPolicy,
  unwrapResponseData,
} from "@/lib/request";

vi.mock("@/lib/authToken", () => ({
  getAuthToken: vi.fn(),
}));

describe("request utilities", () => {
  it("buildApiUrl should prefix HireSpark endpoints with /api/ragent exactly", () => {
    expect(buildApiUrl("/career/interviews")).toBe(
      "/api/ragent/career/interviews",
    );
  });

  it("auth/login does not require token", () => {
    expect(requiresAuthTokenForRequest("/auth/login")).toBe(false);
  });

  it("career endpoint requires token", () => {
    expect(requiresAuthTokenForRequest("/career/interviews")).toBe(true);
  });

  it("requires auth token for absolute HireSpark protected urls", () => {
    expect(
      requiresAuthTokenForRequest("https://host/api/ragent/career/interviews"),
    ).toBe(true);
  });

  it("requires auth token for HireSpark conversation endpoints", () => {
    expect(
      requiresAuthTokenForRequest("/conversations/conversation-1/messages"),
    ).toBe(true);
    expect(
      requiresAuthTokenForRequest(
        "https://host/api/ragent/conversations/conversation-1/messages",
      ),
    ).toBe(true);
  });

  it("requires auth token for protected business endpoints", () => {
    expect(requiresAuthTokenForRequest("/career/interviews")).toBe(true);
    expect(requiresAuthTokenForRequest("/auth/login")).toBe(false);
  });

  it("throws unauthorized before request when protected endpoint has no token", () => {
    vi.mocked(getAuthToken).mockReturnValue(null);

    expect(() => assertRequestAuthorized("/career/interviews")).toThrow(
      AppError,
    );
    expect(() => assertRequestAuthorized("/career/interviews")).toThrow(
      "Unauthorized",
    );
  });

  it("allows protected endpoint when token exists", () => {
    vi.mocked(getAuthToken).mockReturnValue("token-value");

    expect(assertRequestAuthorized("/career/interviews")).toBe("token-value");
  });

  it("buildApiUrl should append query params and skip empty values", () => {
    const url = buildApiUrl("/hello", {
      a: 1,
      b: true,
      c: "",
      d: undefined,
      e: null,
    });

    expect(url).toContain("/api/ragent/hello");
    expect(url).toContain("a=1");
    expect(url).toContain("b=true");
    expect(url).not.toContain("c=");
    expect(url).not.toContain("d=");
    expect(url).not.toContain("e=");
  });

  it("unwrapResponseData should return base response data for success payload", () => {
    const result = unwrapResponseData({
      code: "0",
      message: null,
      data: { ok: true },
      requestId: "r1",
      success: false,
    });

    expect(result).toEqual({ ok: true });
  });

  it("unwrapResponseData should return raw payload for non-base response", () => {
    const result = unwrapResponseData({ plain: true });
    expect(result).toEqual({ plain: true });
  });

  it("unwrapResponseData should throw AppError for failed business response", () => {
    expect(() =>
      unwrapResponseData({
        code: "403",
        message: "forbidden",
        data: null,
        requestId: "r2",
        success: false,
      }),
    ).toThrow(AppError);

    try {
      unwrapResponseData({
        code: "403",
        message: "forbidden",
        data: null,
        requestId: "r2",
        success: false,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe(ErrorCode.FORBIDDEN);
    }
  });

  it("mapAxiosErrorToAppError should map http status codes", () => {
    const axiosError = {
      message: "Not Found",
      response: {
        status: 404,
      },
    } as AxiosError;

    const mapped = mapAxiosErrorToAppError(axiosError);
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });

  it("mapAxiosErrorToAppError should map timeout and cancellation", () => {
    const timeoutError = {
      message: "timeout",
      code: "ECONNABORTED",
    } as AxiosError;
    expect(mapAxiosErrorToAppError(timeoutError).code).toBe(
      ErrorCode.REQUEST_TIMEOUT,
    );

    const cancelError = {
      message: "cancelled",
      __CANCEL__: true,
    } as unknown as AxiosError;
    expect(mapAxiosErrorToAppError(cancelError).code).toBe(ErrorCode.ABORTED);
  });

  it("resolveRequestPolicy should default to GET join and POST off", () => {
    expect(resolveRequestPolicy("GET")).toEqual({
      dedupe: "join",
      debounceMs: 0,
      key: undefined,
    });
    expect(resolveRequestPolicy("POST")).toEqual({
      dedupe: "off",
      debounceMs: 0,
      key: undefined,
    });
  });

  it("buildRequestPolicyKey should be stable for same semantic payload", () => {
    const keyA = buildRequestPolicyKey({
      method: "post",
      url: "/career/interviews",
      params: {
        page: 1,
        size: 20,
      },
      data: {
        b: 2,
        a: 1,
      },
    });
    const keyB = buildRequestPolicyKey({
      method: "POST",
      url: "/career/interviews",
      params: {
        size: 20,
        page: 1,
      },
      data: {
        a: 1,
        b: 2,
      },
    });
    expect(keyA).toBe(keyB);
  });
});
