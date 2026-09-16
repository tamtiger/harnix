# Hoàn thiện nội dung review.md và đưa vào workflow canonical

- **ID:** 20260916-234500-review-md-content-and-workflow-wiring
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-16T14:29:55.439Z
- **Updated:** 2026-09-16T14:37:06.054Z

## Goal

review.md đủ thông tin để biết task còn thiếu gì, và mọi agent ở bất kỳ repo nào cũng biết review.md tồn tại qua workflow/AGENTS template và skill canonical.

## Non-goals

- Không thêm freshness/digest computation vào review.md.
- Không liệt kê research/*.md trong Artifacts.
- Không đổi cơ chế regenerate (vẫn hook trong saveTask).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-review-md-required-checks` (met): review.md liệt kê mọi required check kèm evidence mới nhất hoặc 'chưa chạy'.
- `ac-review-md-metadata` (met): review.md hiện timestamp và Artifacts đúng file tồn tại trên đĩa.
- `ac-workflow-canonical-wiring` (met): workflowTemplate và renderAgentsTemplate nhắc review.md trong output sinh cho consumer project.
- `ac-skill-wiring` (met): harnix-finish-work và harnix-brainstorm nhắc review.md.
- `ac-release-readiness` (met): Patch version và changelog cập nhật một lần trước verifying; exact acceptance sequence pass.

## Required checks

- `focused-review-content` (focused): Xác nhận review.md hiện required checks, timestamp và artifacts đúng. — pass (2026-09-16T14:37:03.517Z)
- `focused-template-wiring` (focused): Xác nhận review.md được nhắc trong canonical template và skill. — pass (2026-09-16T14:37:03.846Z)
- `release-gate` (full): Chạy exact acceptance sequence. — pass (2026-09-16T14:37:04.254Z)

## Decisions

- **d1-cheap-required-checks** — Required checks list dùng validationPlan + selectLatestEvidence có sẵn, không tính lại freshness/digest.
  - _Why:_ saveTask chạy trên mọi persist; tính freshness cần đọc file nguồn theo glob, chi phí I/O không tương xứng với một trang chỉ để đọc.
- **d2-two-surfaces** — Wiring review.md vào cả canonical template (workflow.ts/agents.ts) lẫn skill, không chỉ meta-doc của repo Harnix.
  - _Why:_ docs/HARNIX_PRD.md và IMPLEMENTATION_PLAN.md là tài liệu nội bộ cho người phát triển Harnix; workflowTemplate/agents.ts mới là thứ thực sự ship vào .harnix/workflow.md và AGENTS.md của mọi consumer project.

## Evidence

- `focused-review-content` — pass (2026-09-16T14:37:03.517Z): 23 test pass: review.md hiện Required checks (evidence mới nhất hoặc 'chưa chạy'), timestamp createdAt/updatedAt, và mục Artifacts chỉ liệt kê đúng prd.md/plan.md/design.md thực sự tồn tại trên đĩa (Lite task không có Artifacts).
- `focused-template-wiring` — pass (2026-09-16T14:37:03.846Z): 13 test pass: workflowTemplate và renderAgentsTemplate (ship vào mọi consumer project qua harnix init/update) đều nhắc review.md là derived/không hand-edit; skill harnix-brainstorm và harnix-finish-work cũng nhắc review.md. Init project mới xác nhận AGENTS.md sinh ra chứa review.md.
- `release-gate` — pass (2026-09-16T14:37:04.254Z): Toàn bộ exact acceptance sequence exit 0: build, lint, typecheck, test:acceptance (590 pass, 1 skipped), pack:check, smoke:tarball, measure:init, measure:footprint (giảm 75%), scan:release, git diff --check.
