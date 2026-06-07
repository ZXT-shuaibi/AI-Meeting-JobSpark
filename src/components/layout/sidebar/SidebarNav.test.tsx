import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import SidebarNav from "@/components/layout/sidebar/SidebarNav";

describe("SidebarNav", () => {
  it("keeps the resume nav inactive on interview pages", () => {
    render(
      <MemoryRouter initialEntries={["/career/interviews"]}>
        <SidebarNav />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "简历工作台" }).className,
    ).not.toContain("bg-secondary");
    expect(screen.getByRole("button", { name: "AI 面试" }).className).toContain(
      "bg-secondary",
    );
  });

  it("keeps the AI interview nav active on the main-chain report pages", () => {
    render(
      <MemoryRouter initialEntries={["/career/interview-reports/session-1"]}>
        <SidebarNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "AI 面试" }).className).toContain(
      "bg-secondary",
    );
  });

  it("keeps the AI interview nav active on the legacy interview entry", () => {
    render(
      <MemoryRouter initialEntries={["/interview"]}>
        <SidebarNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "AI 面试" }).className).toContain(
      "bg-secondary",
    );
  });

  it("keeps the AI interview nav active on legacy interview report pages", () => {
    render(
      <MemoryRouter initialEntries={["/interview/report"]}>
        <SidebarNav />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "AI 面试" }).className).toContain(
      "bg-secondary",
    );
    expect(
      screen.getByRole("button", { name: "简历工作台" }).className,
    ).not.toContain("bg-secondary");
  });
});
