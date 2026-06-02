# Resume Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the HireSpark resume flow on top of the AI-Meeting shell so resume input, JD targeting, and optimization output form one clear static user path.

**Architecture:** Keep routing and shell structure unchanged, but refactor the resume pages to center the core workspace. Shared static content will move into focused mock data so list, upload, optimize, and detail pages read from the same product language and sample content.

**Tech Stack:** React 19, TypeScript, React Router 7, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Prepare static data and regression tests

**Files:**
- Modify: `src/pages/resume/resumeMockData.ts`
- Create: `src/pages/resume/ResumeOptimizePage.test.tsx`
- Create: `src/pages/resume/ResumeListPage.test.tsx`

- [ ] **Step 1: Write the failing optimize page test**

```tsx
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ResumeOptimizePage from "./ResumeOptimizePage";

describe("ResumeOptimizePage", () => {
  it("renders the resume and JD workspace with structured results", () => {
    render(
      <MemoryRouter initialEntries={["/resume/optimize?id=resume-01"]}>
        <Routes>
          <Route path="/resume/optimize" element={<ResumeOptimizePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "简历定向优化" })).toBeInTheDocument();
    expect(screen.getByLabelText("简历内容")).toBeInTheDocument();
    expect(screen.getByLabelText("目标岗位链接")).toBeInTheDocument();
    expect(screen.getByText("岗位匹配判断")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the optimize page test and confirm it fails**

Run: `npm.cmd run test:run -- src/pages/resume/ResumeOptimizePage.test.tsx`
Expected: FAIL because the current page does not expose the new workspace headings and labels.

- [ ] **Step 3: Write the failing resume list page test**

```tsx
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ResumeListPage from "./ResumeListPage";

describe("ResumeListPage", () => {
  it("focuses the page on resume actions instead of redesign explanation copy", () => {
    render(
      <MemoryRouter>
        <ResumeListPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "简历工作台" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /上传新简历/i })).toBeInTheDocument();
    expect(screen.queryByText(/AI-Meeting 的基座里/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run the list page test and confirm it fails**

Run: `npm.cmd run test:run -- src/pages/resume/ResumeListPage.test.tsx`
Expected: FAIL because the current list page still contains redesign explanation copy and different heading structure.

- [ ] **Step 5: Expand mock data for the new workspace**

```ts
export const optimizeWorkspaceDraft = {
  resumeText: "负责 AI 面试与简历联动平台的交互重组，梳理上传、JD 对齐与优化反馈链路……",
  jdLink: "https://jobs.example.com/ai-product-frontend",
  jdText: "目标岗位需要候选人具备 AI 产品理解、React/TypeScript 交付能力……",
  focusTags: ["结果表达", "AI 产品闭环", "JD 关键词"],
};

export const optimizationInsightGroups = [
  {
    title: "优势亮点",
    items: ["跨产品链路视角明确", "前端交付与体验表达兼顾"],
  },
  {
    title: "岗位缺口",
    items: ["AI 产出指标表达仍偏弱", "JD 关键词映射不够集中"],
  },
];
```

- [ ] **Step 6: Re-run both tests and keep them failing for the expected missing-UI reason**

Run: `npm.cmd run test:run -- src/pages/resume/ResumeOptimizePage.test.tsx src/pages/resume/ResumeListPage.test.tsx`
Expected: FAIL with assertion mismatches only, proving the new behavior is not implemented yet.

### Task 2: Rebuild the optimization workspace

**Files:**
- Modify: `src/pages/resume/ResumeOptimizePage.tsx`
- Modify: `src/pages/resume/resumeMockData.ts`
- Test: `src/pages/resume/ResumeOptimizePage.test.tsx`

- [ ] **Step 1: Implement the two-column input workspace**

```tsx
<section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
  <WorkspacePanel
    title="简历内容"
    subtitle="上传原始简历或直接粘贴正文，再进入定向优化。"
  >
    <ResumeUploadAction />
    <label className="sr-only" htmlFor="resume-content">简历内容</label>
    <textarea id="resume-content" defaultValue={optimizeWorkspaceDraft.resumeText} />
  </WorkspacePanel>

  <WorkspacePanel
    title="目标 JD"
    subtitle="可填写招聘链接，也可直接粘贴岗位描述。"
  >
    <label className="sr-only" htmlFor="jd-link">目标岗位链接</label>
    <input id="jd-link" defaultValue={optimizeWorkspaceDraft.jdLink} />
    <label className="sr-only" htmlFor="jd-content">岗位描述</label>
    <textarea id="jd-content" defaultValue={optimizeWorkspaceDraft.jdText} />
  </WorkspacePanel>
</section>
```

- [ ] **Step 2: Add one clear primary action and structured result zone**

```tsx
<div className="rounded-[32px] border border-slate-200 bg-white p-6">
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-semibold text-slate-900">岗位匹配判断</p>
      <p className="mt-2 text-sm text-slate-500">{optimizationOverview.matchSummary}</p>
    </div>
    <Button className="rounded-full">开始优化</Button>
  </div>

  <div className="mt-6 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
    <ScoreSummary />
    <InsightGroups />
  </div>
</div>
```

- [ ] **Step 3: Replace stitched snapshot cards with lightweight sections**

```tsx
function WorkspacePanel({ title, subtitle, children }: WorkspacePanelProps) {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-lg font-semibold tracking-tight text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Run the optimize page test and confirm it passes**

Run: `npm.cmd run test:run -- src/pages/resume/ResumeOptimizePage.test.tsx`
Expected: PASS with the new heading, labels, and result area present.

- [ ] **Step 5: Refactor repeated panel and result markup without changing behavior**

```tsx
function ResultGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item} className="text-sm leading-6 text-slate-600">{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Task 3: Simplify the list and upload path around the workspace

**Files:**
- Modify: `src/pages/resume/ResumeListPage.tsx`
- Modify: `src/pages/resume/ResumeUploadPage.tsx`
- Modify: `src/pages/resume/ResumeDetailPage.tsx`
- Test: `src/pages/resume/ResumeListPage.test.tsx`

- [ ] **Step 1: Replace strategy-heavy list page copy with action-led copy**

```tsx
<div className="space-y-3">
  <p className="text-sm font-medium tracking-[0.16em] text-slate-400">RESUME WORKSPACE</p>
  <h1 className="text-4xl font-semibold tracking-tight text-slate-950">简历工作台</h1>
  <p className="max-w-2xl text-base leading-7 text-slate-500">
    管理版本、补充目标岗位，并进入定向优化与模拟面试。
  </p>
</div>
```

- [ ] **Step 2: Tighten upload page into a feeder page**

```tsx
<section className="rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-8 py-10">
  <h1 className="text-3xl font-semibold tracking-tight text-slate-950">导入简历</h1>
  <p className="mt-3 text-sm leading-7 text-slate-500">
    上传 PDF，或在下一步直接粘贴正文，系统会把内容带入简历优化工作台。
  </p>
</section>
```

- [ ] **Step 3: Add a direct return-to-optimize action on the detail page**

```tsx
<div className="flex flex-wrap gap-3">
  <Button asChild className="rounded-full">
    <Link to={`${ROUTES.resumeOptimize}?id=${resume.id}`}>继续优化</Link>
  </Button>
</div>
```

- [ ] **Step 4: Run the list page test and confirm it passes**

Run: `npm.cmd run test:run -- src/pages/resume/ResumeListPage.test.tsx`
Expected: PASS with the new action-led heading and without the old explanation copy.

- [ ] **Step 5: Spot-check related route behavior**

Run: `npm.cmd run test:run -- src/app/router.test.tsx`
Expected: PASS and confirm preview routes still resolve without authentication.

### Task 4: Full verification and finish

**Files:**
- Verify: `src/pages/resume/*.tsx`
- Verify: `src/pages/resume/*.test.tsx`

- [ ] **Step 1: Run resume page tests together**

Run: `npm.cmd run test:run -- src/pages/resume/ResumeOptimizePage.test.tsx src/pages/resume/ResumeListPage.test.tsx src/app/router.test.tsx`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm.cmd run lint`
Expected: PASS with no errors

- [ ] **Step 3: Run typecheck**

Run: `npm.cmd run typecheck`
Expected: PASS with no TypeScript errors

- [ ] **Step 4: Run build**

Run: `npm.cmd run build`
Expected: PASS and generate the production bundle

- [ ] **Step 5: Review the diff before any git action**

Run: `git diff -- src/pages/resume src/app/router.test.tsx docs/superpowers/plans/2026-06-02-resume-workspace-implementation.md`
Expected: Only resume workspace, tests, and plan changes appear.
