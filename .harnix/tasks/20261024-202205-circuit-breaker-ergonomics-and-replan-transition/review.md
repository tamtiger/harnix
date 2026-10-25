# Cải tiến Circuit Breaker Ergonomics, Chuyển Trạng Thái Replan Trực Tiếp và Cảnh Báo Input Glob

- **ID:** 20261024-202205-circuit-breaker-ergonomics-and-replan-transition
- **Mode:** lite
- **Epic:** 20261024-202200-harnix-dx-workflow-improvements
- **Status:** completed/finishing
- **Created:** 2026-10-24 22:24:00 +07:00
- **Updated:** 2026-10-24 22:58:33 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Giải quyết 3 vấn đề cọ xát phát sinh trong quá trình thực chiến: (1) Nâng cấp Circuit Breaker của --run-check cho phép reset và chạy lại khi có thay đổi code/digest hoặc dùng cờ --reset-breaker <id> --reason <why> thay vì bắt buộc rename check; (2) Cho phép chuyển trạng thái trực tiếp từ checkpoint replan về in_progress/implementing khi task vốn đang in_progress; (3) Kiểm tra và cảnh báo sớm khi input glob cố định không khớp file nào trong repository.

## Non-goals

- Không bỏ qua kiểm tra an toàn circuit breaker khi không có thay đổi mã nguồn
- Không cho phép replan không có lý do hợp lệ

## Relevant paths

- `src/core/workflow/retry-guard.ts`
- `src/core/workflow/transition.ts`
- `src/core/tasks/task-validate-contracts.ts`
- `test/unit/core/workflow/retry-guard.test.ts`
- `test/unit/core/workflow/transition.test.ts`
- `test/unit/core/tasks/task-validate-contracts.test.ts`

## Relevant specs

- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +7 / -0 |
| `README.md` | modified | +2 / -1 |
| `docs/HARNIX_PRD.md` | modified | +5 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +6 / -3 |
| `package.json` | modified | +1 / -1 |
| `src/cli-workflow-commands.ts` | modified | +16 / -2 |
| `src/commands/internal-context.ts` | modified | +35 / -3 |
| `src/commands/status.ts` | modified | +42 / -0 |
| `src/commands/workflow-command.ts` | modified | +2 / -0 |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -2 |
| `src/commands/workflow-flags.ts` | modified | +6 / -2 |
| `src/commands/workflow-handlers.ts` | modified | +10 / -0 |
| `src/core/tasks/task-validate-contracts.ts` | modified | +21 / -5 |
| `src/core/tasks/workflow-helpers.ts` | modified | +5 / -2 |
| `src/core/workflow/check-input-validator.ts` | added | - |
| `src/core/workflow/check-output.ts` | modified | +7 / -1 |
| `src/core/workflow/completion.ts` | modified | +25 / -3 |
| `src/core/workflow/index.ts` | modified | +6 / -0 |
| `src/core/workflow/init-task.ts` | modified | +5 / -4 |
| `src/core/workflow/obligations.ts` | modified | +50 / -25 |
| `src/core/workflow/plan-edit.ts` | modified | +5 / -0 |
| `src/core/workflow/plan-sync.ts` | modified | +107 / -1 |
| `src/core/workflow/replace-check.ts` | modified | +8 / -2 |
| `src/core/workflow/reset-breaker.ts` | added | - |
| `src/core/workflow/retry-guard.ts` | modified | +9 / -4 |
| `src/core/workflow/run-check.ts` | modified | +3 / -3 |
| `src/core/workflow/schema.ts` | modified | +50 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +1 / -1 |
| `src/core/workflow/transition.ts` | modified | +12 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/templates/harnix/activation.ts` | modified | +2 / -2 |
| `test/integration/commands/workflow-command.test.ts` | modified | +5 / -0 |
| `test/integration/commands/workflow-flags.test.ts` | modified | +15 / -1 |
| `test/unit/commands/internal-context.test.ts` | added | - |
| `test/unit/commands/status.test.ts` | modified | +27 / -1 |
| `test/unit/commands/workflow-handlers.test.ts` | modified | +17 / -0 |

_(17 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Hỗ trợ cơ chế reset Circuit Breaker cho check bị khóa do fail 2 lần liên tiếp: cho phép chạy lại khi inputDigest của check thay đổi (chứng minh có code change) hoặc cung cấp cờ workflow --reset-breaker <check-id> --reason <why> mà không bắt buộc đổi ID check.
- [x] `ac-2` (met): Cho phép lệnh workflow --transition in_progress/implementing chuyển trực tiếp từ checkpoint replan khi task vốn đang ở status in_progress mà không bắt buộc qua bước trung gian ready/ready.
- [x] `ac-3` (met): Bổ sung kiểm tra cảnh báo hoặc từ chối sớm ở workflow --init và workflow --set-check nếu một input glob cố định không khớp bất kỳ file nào trong workspace.

## Required checks

- [x] `chk-unit-retry-guard` (focused): Kiểm thử cơ chế circuit breaker reset và retry khi digest đổi — pass (2026-10-24 22:41:01 +07:00)
- [x] `chk-unit-transition-replan` (focused): Kiểm thử chuyển trạng thái từ replan về in_progress/implementing — pass (2026-10-24 22:41:21 +07:00)
- [x] `chk-unit-check-inputs` (focused): Kiểm thử kiểm tra input pattern rỗng — pass (2026-10-24 22:40:51 +07:00)
- [x] `check-suite` (full): Toàn bộ test suite bảo đảm không hồi quy — pass (2026-10-24 22:58:15 +07:00)

## Evidence

- `chk-unit-retry-guard` — pass (2026-10-24 22:41:01 +07:00): pnpm vitest run test/unit/core/workflow/retry-guard.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-unit-transition-replan` — pass (2026-10-24 22:41:21 +07:00): pnpm vitest run test/unit/core/workflow/transition.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-24 22:40:39 +07:00): Task contract revised at persisted replan: Update check command and inputs to target dedicated unit test
- `chk-unit-check-inputs` — pass (2026-10-24 22:40:51 +07:00): pnpm vitest run test/unit/core/workflow/check-input-validator.test.ts — exit 0
- `check-suite` — pass (2026-10-24 22:58:15 +07:00): pnpm test — exit 0 _(4 earlier reruns not shown; see task.json for full history)_
