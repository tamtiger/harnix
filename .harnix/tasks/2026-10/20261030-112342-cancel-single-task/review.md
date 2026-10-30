# Hủy một task không active bằng --task

- **ID:** 20261030-112342-cancel-single-task
- **Mode:** lite
- **Epic:** 20261030-110106-workflow-ergonomics
- **Status:** completed/finishing
- **Created:** 2026-10-30 11:23:42 +07:00
- **Updated:** 2026-10-30 13:37:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

workflow --cancel nhận --task <id> để hủy task unfinished không active mà không cần resume, giữ nguyên yêu cầu authorizedBy user.

## Relevant paths

- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-handlers.ts`
- `src/core/workflow/actions.ts`
- `src/core/workflow/cancel.ts`
- `src/core/workflow/schema.ts`
- `src/core/workflow/target-task.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +28 / -28 |
| `docs/HARNIX_PRD.md` | modified | +3 / -3 |
| `docs/HARNIX_WORKFLOW.md` | modified | +4 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +6 / -0 |
| `src/cli-tasks-command.ts` | added | - |
| `src/cli-workflow-commands.ts` | modified | +3 / -23 |
| `src/commands/workflow-command.ts` | modified | +1 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -2 |
| `src/core/tasks/read-tracker.ts` | modified | +3 / -2 |
| `src/core/tasks/task-index.ts` | modified | +40 / -5 |
| `src/core/workflow/cancel.ts` | modified | +20 / -1 |
| `src/core/workflow/init-task.ts` | modified | +6 / -1 |
| `src/core/workflow/schema.ts` | modified | +3 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +6 / -1 |
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
| `test/integration/commands/workflow-handlers.test.ts` | modified | +23 / -0 |
| `test/unit/cli-helpers.test.ts` | modified | +7 / -0 |
| `test/unit/cli-tasks-command.test.ts` | added | - |
| `test/unit/commands/workflow-flag-owners.test.ts` | modified | +1 / -1 |
| `test/unit/core/tasks/read-tracker.test.ts` | modified | +4 / -2 |
| `test/unit/core/tasks/task-index.test.ts` | modified | +49 / -0 |
| `test/unit/core/workflow/cancel.test.ts` | modified | +47 / -0 |
| `test/unit/core/workflow/secret-scan.test.ts` | modified | +15 / -1 |
| `test/unit/core/workflow/similar-tasks.test.ts` | added | - |
| `test/unit/core/workflow/target-task.test.ts` | modified | +3 / -1 |
| `test/unit/utils/file-lock.test.ts` | modified | +24 / -0 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -2 |
| `test/workflow/cli-contract.test.ts` | modified | +8 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): workflow --cancel --task <id> --reason <why> hủy đúng một task unfinished không active, không đổi con trỏ .active trừ khi nó trỏ tới task đó; id đã kết thúc bị từ chối kèm hint; --schema, workflow-flag-owners và golden được cập nhật.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-30 13:36:37 +07:00)
- [x] `chk-cancel` (focused): chk-cancel — pass (2026-10-30 13:35:16 +07:00)

## Evidence

- `chk-cancel` — pass (2026-10-30 13:35:16 +07:00): pnpm exec vitest run test/workflow test/unit/commands test/unit/core/workflow test/integration/commands — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-30 13:36:37 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
