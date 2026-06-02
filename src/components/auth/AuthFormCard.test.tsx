import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AuthFormCard from "@/components/auth/AuthFormCard";
import { ROUTES } from "@/lib/constants";

describe("AuthFormCard", () => {
  it("renders a static preview entry when preview mode is enabled", () => {
    render(
      <MemoryRouter>
        <AuthFormCard
          mode="login"
          formData={{ username: "", password: "", confirmPassword: "" }}
          errorMessage=""
          isSubmitting={false}
          showPreviewEntry
          onSwitchMode={vi.fn()}
          onInputChange={vi.fn()}
          onSubmit={vi.fn()}
        />
      </MemoryRouter>,
    );

    const previewLink = screen.getByRole("link", { name: "直接查看内部预览" });
    expect(previewLink.getAttribute("href")).toBe(ROUTES.previewResumeList);
  });
});
