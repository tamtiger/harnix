# Doctor cảnh báo sớm check thiếu cwd, plan.md lệch và task trùng

- **ID:** 20261030-111311-doctor-task-preflight
- **Mode:** lite
- **Epic:** 20261030-110106-workflow-ergonomics
- **Status:** completed/finishing
- **Created:** 2026-10-30 11:13:11 +07:00
- **Updated:** 2026-10-30 13:58:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

harnix doctor báo mức warning các lỗi cấu hình task mà hiện chỉ lộ ra ở ready gate hoặc lúc chạy check.

## Relevant paths

- `src/core/doctor/finding-codes-project.ts`
- `src/core/doctor/project-tasks.ts`
- `src/core/workflow/ready-artifacts.ts`
- `test/workflow/doctor-finding-fixtures-project.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +13 / -0 |
| `README.md` | modified | +29 / -29 |
| `docs/HARNIX_PRD.md` | modified | +4 / -4 |
| `docs/HARNIX_WORKFLOW.md` | modified | +6 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +6 / -0 |
| `src/cli-tasks-command.ts` | added | - |
| `src/cli-workflow-commands.ts` | modified | +3 / -23 |
| `src/commands/workflow-command.ts` | modified | +18 / -17 |
| `src/commands/workflow-error-hints.ts` | added | - |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -2 |
| `src/core/doctor/finding-codes-project.ts` | modified | +3 / -0 |
| `src/core/doctor/project-tasks.ts` | modified | +7 / -1 |
| `src/core/doctor/project.ts` | modified | +5 / -1 |
| `src/core/doctor/task-preflight.ts` | added | - |
| `src/core/tasks/read-tracker.ts` | modified | +3 / -2 |
| `src/core/tasks/task-index.ts` | modified | +40 / -5 |
| `src/core/workflow/batch-validate.ts` | modified | +4 / -1 |
| `src/core/workflow/cancel.ts` | modified | +19 / -1 |
| `src/core/workflow/epic-members.ts` | modified | +1 / -1 |
| `src/core/workflow/init-task.ts` | modified | +7 / -2 |
| `src/core/workflow/plan-criterion-notice.ts` | added | - |
| `src/core/workflow/plan-edit.ts` | modified | +4 / -1 |
| `src/core/workflow/ready-artifacts.ts` | modified | +4 / -1 |
| `src/core/workflow/schema.ts` | modified | +3 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +6 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +2 / -0 |
| `src/core/workflow/similar-tasks.ts` | added | - |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-plan/references/epic.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/utils/file-lock.ts` | modified | +4 / -8 |
| `test/integration/commands/workflow-handlers.test.ts` | modified | +39 / -0 |
| `test/unit/cli-helpers.test.ts` | modified | +7 / -0 |
| `test/unit/cli-tasks-command.test.ts` | added | - |
| `test/unit/commands/workflow-error-hints.test.ts` | added | - |
| `test/unit/commands/workflow-flag-owners.test.ts` | modified | +1 / -1 |
| `test/unit/core/doctor/task-preflight.test.ts` | added | - |

_(15 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Mã finding warning task-check-cwd-missing: check của task chưa kết thúc không có cwd trong khi inputs nằm trọn trong một package của workspace nhiều package (nguồn package roots được inject để test); check có inputs bao nhiều package hoặc ở gốc thì không cảnh báo.
- [x] `ac-2` (met): Mã finding warning task-plan-criterion-missing: plan.md của task Full chưa kết thúc không nhắc một criterion id (tái dùng missingCriteriaInPlan của ready-artifacts).
- [x] `ac-3` (met): Mã finding warning task-near-duplicate: hai task planning hoặc ready gần giống bằng đúng helper của task cảnh báo khi tạo task; chỉ so task planning và ready.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-30 13:54:17 +07:00)
- [x] `chk-doctor` (focused): Test doctor: mã mới, fixture sinh ra từng mã và danh mục mã — pass (2026-10-30 13:52:56 +07:00)

## Decisions

- **late-member** — Member này được thêm sau khi khởi tạo epic bằng --init --epic --no-activate; chạy sau cùng vì dùng helper của task sprawl-guard.
  - _Why:_ Doctor phát hiện thêm sau lượt review đầu; thứ tự chạy do epic-order.

## Evidence

- `chk-doctor` — pass (2026-10-30 13:52:56 +07:00): pnpm exec vitest run test/unit/core/doctor test/integration/commands/doctor.test.ts test/workflow/doctor-finding-fixtures-project.test.ts — exit 0
- `check-suite` — pass (2026-10-30 13:54:17 +07:00): pnpm test — exit 0
