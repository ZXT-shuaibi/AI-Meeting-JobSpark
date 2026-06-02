# HireSpark Resume Workspace Redesign

Date: 2026-06-02
Project: `HireSpark-ai-meeting-base`
Status: Approved concept, pending implementation

## Goal

Rebuild the resume optimization flow on top of the AI-Meeting shell so the resume product path is clearer and more task-focused. The redesigned static UI should connect JobSpark's resume upload, list, optimization, and detail flow into one coherent experience.

## Product Direction

- Keep the AI-Meeting shell, navigation rhythm, and clean stage-like layout as the visual base.
- Reuse JobSpark's resume feature logic as the reference for the product path.
- Reduce explanatory and strategy-heavy copy inside pages.
- Make the primary user task obvious: submit a resume, provide a target JD, review structured optimization output.

## Recommended Approach

Use a single workspace layout for the optimization page.

- Left side: resume input and resume content area.
- Right side: target JD input area.
- Lower section: optimization result area with structured outputs.

This approach is preferred because it keeps the whole task in one place, matches the user's requested reference pattern, and makes the static prototype easier to review than a multi-step or drawer-based flow.

## Page-Level Changes

### 1. Resume List

The resume list remains the entry hub, but the wording should stop explaining design strategy. It should focus on user actions:

- Upload a new resume
- Continue optimization on an existing resume
- View resume details

The page should feel like a clean index of current assets, not a presentation page about the redesign itself.

### 2. Resume Upload

The upload page should still exist as an entry for file-based import, but it should become simpler and support the larger workflow:

- Upload local resume file
- Optional quick entry to continue into optimization
- Reduce decorative guidance blocks

This page should behave as a feeder into the optimization workspace, not as a separate long-form explanation page.

### 3. Resume Optimize

This is the main redesign target.

The page should be reorganized into three functional zones:

- Resume zone
  - File upload action
  - Paste or edit resume text
  - Lightweight structure preview for key sections
- JD zone
  - Job link input
  - JD text area
  - Optional quick template hints
- Result zone
  - Match score
  - Strengths
  - Gaps
  - Rewrite directions
  - Optimized output preview or next-step export action

The page should not use many stitched cards with equal visual weight. The highest emphasis should stay on the two inputs and the optimization result.

### 4. Resume Detail

The detail page can remain more document-like, but should align with the rewritten optimization path:

- Let the user review a structured resume version
- Provide a clear way back to optimization
- Keep hierarchy crisp and text-first

## Interaction Principles

- The first screen should answer three questions immediately:
  - Which resume am I optimizing?
  - Which job am I targeting?
  - Where do I start?
- The primary call to action should be singular and obvious.
- Result content should be structured by usefulness, not by decorative grouping.
- Secondary information such as process notes or system status should be visually weaker than the main content.

## Content Strategy

- Use concise Chinese UI labels.
- Avoid colloquial "big white words" and avoid internal product explanation.
- Favor professional, utility-oriented wording.
- Labels should be short, while helper text should only appear where it reduces ambiguity.

## Visual Direction

- Continue from AI-Meeting's cleaner shell rather than the previous heavy stitched-card approach.
- Reduce glass-like effects.
- Prefer simple surfaces, restrained contrast, and stronger typography hierarchy.
- Allow subtle depth and spatial layout, but keep the page practical rather than flashy.

## Data / Mock Requirements

The static prototype will likely need expanded mock data for:

- Sample pasted resume content
- JD link
- JD text body
- Structured optimization sections
- Optional optimized resume preview excerpt

## Error and Empty States

- If no resume is selected, guide the user back to list or into a sample resume.
- If resume text or JD is empty, preserve the layout and show inline guidance instead of collapsing the page.
- Keep empty states aligned with the same shell and spacing rules as the main content.

## Verification Scope

Implementation should be verified with:

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`

Preview should use the public no-login routes so the user can inspect the static pages without authentication.

## Implementation Boundary

This redesign is for the static frontend prototype only.

- No backend integration is required in this pass.
- No real upload handling is required in this pass.
- The focus is page structure, copy, hierarchy, and clear product flow.
