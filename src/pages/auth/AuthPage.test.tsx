import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AuthPage from "@/pages/auth/AuthPage";

const isStaticPreviewEnabledMock = vi.fn();

vi.mock("@/config/env", () => ({
  isStaticPreviewEnabled: () => isStaticPreviewEnabledMock(),
}));

vi.mock("@/hooks/auth/useAuthPageController", () => ({
  useAuthPageController: () => ({
    mode: "login",
    formData: { username: "", password: "", confirmPassword: "" },
    loading: false,
    error: "",
    registerLoading: false,
    localError: "",
    switchMode: vi.fn(),
    handleInputChange: vi.fn(),
    handleSubmit: vi.fn(),
  }),
}));

vi.mock("@/components/auth/AuthMarketingPanel", () => ({
  default: function MockAuthMarketingPanel() {
    return <div>marketing-panel</div>;
  },
}));

vi.mock("@/components/auth/AuthFormCard", () => ({
  default: function MockAuthFormCard() {
    return <div>auth-form-card</div>;
  },
}));

describe("AuthPage", () => {
  it("redirects to the resume list in static preview mode", async () => {
    isStaticPreviewEnabledMock.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/preview/resume/list" element={<div>resume-list-page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("resume-list-page")).toBeDefined();
  });
});
