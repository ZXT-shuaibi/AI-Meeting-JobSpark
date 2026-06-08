import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/request", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock("@/lib/authToken", () => ({
  getAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

import { authService } from "@/services/authService";

describe("authService", () => {
  it("does not expose removed legacy user compatibility queries anymore", () => {
    expect("getUser" in authService).toBe(false);
    expect("getUserActual" in authService).toBe(false);
    expect("hasUsername" in authService).toBe(false);
  });
});
