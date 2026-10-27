# Sửa 3 lỗi archive từ review

- **ID:** 20261027-162126-archive-review-fixes
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-27 16:21:26 +07:00
- **Updated:** 2026-10-27 16:30:49 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 1 | risk-flaky-concurrency: low |

## Goal

Sửa trùng ID live/archive, restore epic dở dang và epic có member hỏng, kèm test hồi quy; plan/apply của archive kiểm lại trong khóa.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -0 |
| `CHANGELOG.md` | modified | +15 / -0 |
| `README.md` | modified | +6 / -4 |
| `docs/HARNIX_PRD.md` | modified | +12 / -6 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -0 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/rename-retry.mjs` | added | - |
| `scripts/version-sync.mjs` | modified | +3 / -2 |
| `src/cli-archive-command.ts` | added | - |
| `src/cli-program.ts` | modified | +2 / -0 |
| `src/cli-workflow-commands.ts` | modified | +6 / -3 |
| `src/commands/archive.ts` | added | - |
| `src/commands/doctor.ts` | modified | +7 / -1 |
| `src/commands/epic.ts` | modified | +19 / -12 |
| `src/commands/resume.ts` | modified | +3 / -2 |
| `src/commands/update.ts` | modified | +7 / -0 |
| `src/core/context/effective-context.ts` | modified | +2 / -1 |
| `src/core/doctor/layout-finding.ts` | added | - |
| `src/core/doctor/project-tasks.ts` | modified | +9 / -11 |
| `src/core/doctor/project.ts` | modified | +2 / -0 |
| `src/core/doctor/restore-artifacts.ts` | modified | +8 / -7 |
| `src/core/epics/epic-location.ts` | added | - |
| `src/core/epics/epic.ts` | modified | +13 / -86 |
| `src/core/epics/members.ts` | added | - |
| `src/core/epics/migrate.ts` | modified | +5 / -4 |
| `src/core/journal/learning-sources.ts` | modified | +2 / -2 |
| `src/core/tasks/archive.ts` | added | - |
| `src/core/tasks/layout-migration.ts` | added | - |
| `src/core/tasks/task-audit.ts` | modified | +2 / -2 |
| `src/core/tasks/task-index.ts` | modified | +23 / -23 |
| `src/core/tasks/task-location.ts` | added | - |
| `src/core/tasks/task-migration.ts` | modified | +3 / -2 |
| `src/core/tasks/task-resume.ts` | modified | +2 / -1 |
| `src/core/tasks/task-store.ts` | modified | +7 / -4 |
| `src/core/verification/input-digest.ts` | modified | +4 / -5 |
| `src/core/workflow/baseline-hint.ts` | modified | +6 / -8 |
| `src/core/workflow/context.ts` | modified | +2 / -1 |
| `src/core/workflow/epic-members.ts` | modified | +3 / -4 |
| `src/core/workflow/init-lineage.ts` | modified | +13 / -3 |
| `src/core/workflow/learn.ts` | modified | +3 / -2 |
| `src/core/workflow/obligations.ts` | modified | +3 / -2 |
| `src/core/workflow/plan-sync.ts` | modified | +3 / -2 |
| `src/core/workflow/ready-artifacts.ts` | modified | +2 / -1 |
| `src/core/workflow/save-files.ts` | modified | +8 / -4 |
| `src/core/workflow/save.ts` | modified | +4 / -3 |
| `src/core/workflow/target-task.ts` | modified | +2 / -2 |
| `src/core/workflow/transition.ts` | modified | +3 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |

_(74 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Một ID có cả bản sống và bản trong _archive không bị bỏ qua âm thầm: kế hoạch archive báo mục trùng và không coi bản sống là đã lưu trữ.
- [x] `ac-2` (met): harnix archive --restore <epic> restore các member trước epic để lần chạy lại sau lỗi giữa chừng vẫn hoàn tất, và apply kiểm lại trạng thái trong khóa.
- [x] `ac-3` (met): Epic có task live không đọc được không bị archive, và lý do được báo trong skipped.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-27 16:28:55 +07:00)
- [x] `chk-focused` (focused): chk-focused — pass (2026-10-27 16:24:18 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite — pass (2026-10-27 16:30:10 +07:00)
- [x] `chk-gates` (focused): Test hợp đồng — pass (2026-10-27 16:25:39 +07:00)

## Residual risks

- **risk-flaky-concurrency** (low) — Test plan-edit 'six commands add a decision concurrently' lỗi một lần khi chạy cả suite dưới tải và đạt khi chạy riêng 3 lần; có vẻ flaky từ trước, không liên quan archive.

## Evidence

- `chk-focused` — pass (2026-10-27 16:24:18 +07:00): pnpm exec vitest run test/unit/core/tasks/archive.test.ts test/integration/commands/archive.test.ts — exit 0
- `chk-gates` — pass (2026-10-27 16:25:39 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-27 16:28:55 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-27 16:30:10 +07:00): pnpm test — exit 0
