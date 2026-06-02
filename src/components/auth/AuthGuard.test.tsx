import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthGuard from "@/components/auth/AuthGuard";

const useAppSelectorMock = vi.fn();
const isStaticPreviewEnabledMock = vi.fn();

vi.mock("@/store/hooks", () => ({
  useAppSelector: (selector: (state: unknown) => unknown) =>
    useAppSelectorMock(selector),
}));

vi.mock("@/config/env", () => ({
  isStaticPreviewEnabled: () => isStaticPreviewEnabledMock(),
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    useAppSelectorMock.mockReset();
    isStaticPreviewEnabledMock.mockReset();
  });

  it("redirects unauthenticated users to auth when preview mode is off", async () => {
    useAppSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ user: { isAuthenticated: false } }),
    );
    isStaticPreviewEnabledMock.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/career"]}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/career" element={<div>protected-page</div>} />
          </Route>
          <Route path="/auth" element={<div>auth-page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("auth-page")).toBeDefined();
  });

  it("allows access in static preview mode without authentication", async () => {
    useAppSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ user: { isAuthenticated: false } }),
    );
    isStaticPreviewEnabledMock.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/career"]}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/career" element={<div>protected-page</div>} />
          </Route>
          <Route path="/auth" element={<div>auth-page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("protected-page")).toBeDefined();
  });

  it("renders the protected route when the user is authenticated", async () => {
    useAppSelectorMock.mockImplementation(
      (selector: (state: unknown) => unknown) =>
        selector({ user: { isAuthenticated: true } }),
    );
    isStaticPreviewEnabledMock.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={["/career"]}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/career" element={<div>protected-page</div>} />
          </Route>
          <Route path="/auth" element={<div>auth-page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("protected-page")).toBeDefined();
  });
});
