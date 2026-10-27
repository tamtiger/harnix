# Migration task và epic từ bố cục phẳng sang bucket theo tháng

- **ID:** 20261027-102137-task-layout-migration
- **Mode:** full
- **Epic:** 20261027-102134-task-layout-bucket-archive
- **Status:** completed/finishing
- **Created:** 2026-10-27 10:21:37 +07:00
- **Updated:** 2026-10-27 14:18:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | migration-concurrent-writers: low |

## Goal

Thêm migration idempotent chuyển .harnix/tasks/<id> và .harnix/epics/<id> sang bucket tháng qua harnix update và harnix doctor --fix, bằng rename nguyên tử dưới khóa workflow, có dry-run, không mất dữ liệu và không đổi nội dung; chạy sau migration roadmaps cũ.

## Non-goals

- Không archive task trong migration
- Không sửa nội dung task.json, review.md hay artifact

## Relevant paths

- `src/core/migration/**`
- `src/core/doctor/**`
- `src/commands/update.ts`
- `src/commands/doctor.ts`
- `test/migration/**`
- `test/integration/commands/update.test.ts`
- `test/integration/commands/doctor.test.ts`

## Relevant specs

- `docs/IMPLEMENTATION_PLAN.md`
- `docs/HARNIX_WORKFLOW.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -0 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +5 / -4 |
| `docs/HARNIX_PRD.md` | modified | +5 / -4 |
| `package.json` | modified | +1 / -1 |
| `scripts/rename-retry.mjs` | added | - |
| `scripts/version-sync.mjs` | modified | +3 / -2 |
| `src/cli-workflow-commands.ts` | modified | +6 / -3 |
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
| `src/core/epics/epic.ts` | modified | +11 / -86 |
| `src/core/epics/members.ts` | added | - |
| `src/core/epics/migrate.ts` | modified | +5 / -4 |
| `src/core/journal/learning-sources.ts` | modified | +2 / -2 |
| `src/core/tasks/layout-migration.ts` | added | - |
| `src/core/tasks/task-audit.ts` | modified | +2 / -2 |
| `src/core/tasks/task-index.ts` | modified | +23 / -23 |
| `src/core/tasks/task-location.ts` | added | - |
| `src/core/tasks/task-migration.ts` | modified | +3 / -2 |
| `src/core/tasks/task-resume.ts` | modified | +2 / -1 |
| `src/core/tasks/task-store.ts` | modified | +5 / -4 |
| `src/core/verification/input-digest.ts` | modified | +4 / -5 |
| `src/core/workflow/baseline-hint.ts` | modified | +6 / -8 |
| `src/core/workflow/context.ts` | modified | +2 / -1 |
| `src/core/workflow/epic-members.ts` | modified | +3 / -4 |
| `src/core/workflow/init-lineage.ts` | modified | +3 / -2 |
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
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |

_(60 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): harnix update và harnix doctor --fix chuyển mọi task phẳng và mọi epic (thư mục, <id>.json phẳng) sang bucket tháng bằng rename; chạy lần hai không đổi gì (idempotent); --dry-run chỉ liệt kê và không ghi.
- [x] `ac-2` (met): Migration chạy dưới khóa workflow của dự án, không bao giờ ghi đè đích đã tồn tại (báo skipped) và một thư mục task không rename được thì chỉ bị bỏ qua có báo cáo; lỗi giữa chừng không để task ở trạng thái mất hay trùng và lần chạy sau tiếp tục được.
- [x] `ac-3` (met): Con trỏ .active và task đang hoạt động vẫn dùng được sau migration; doctor báo task-layout-legacy khi còn task phẳng và hết báo sau khi sửa.
- [x] `ac-4` (met): Hash nội dung từng file trước và sau migration bằng nhau, số task và số epic không đổi, kiểm bằng test trên cây có nhiều task và epic đủ bố cục; số liệu chạy trên bản sao repo này (task và epic thật) được ghi vào decision trace-copy.

## Required checks

- [x] `chk-migration` (focused): Test migration bố cục task — pass (2026-10-27 14:16:16 +07:00)
- [x] `chk-gates` (focused): Contract tests (CLI, docs, golden, kiến trúc) — pass (2026-10-27 14:16:22 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-10-27 14:17:41 +07:00)

## Decisions

- **trace-copy** — Chạy harnix update trên bản sao .harnix của repo này: 257 task và 32 epic chuyển sang bucket tháng, 0 skipped, 965 file có hash nội dung giống hệt trước và sau, lần chạy thứ hai không báo gì.
  - _Why:_ Kiểm chứng ac-4 trên dữ liệu thật mà không chạm repo gốc.

## Residual risks

- **migration-concurrent-writers** (low) — Migration chạy dưới khóa workflow của dự án nên chỉ chặn các lệnh harnix khác; một editor hay worktree/subagent đang giữ file trong thư mục task làm rename lỗi và thư mục đó chỉ bị bỏ qua có báo cáo (lần sau chạy tiếp).

## Evidence

- `chk-migration` — pass (2026-10-27 14:16:16 +07:00): pnpm test:migration — exit 0
- `chk-gates` — pass (2026-10-27 14:16:22 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-10-27 14:17:41 +07:00): pnpm test — exit 0
