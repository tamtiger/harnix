# Thêm builder task completed hợp lệ cho test

- **ID:** 20261104-112539-completed-task-builder
- **Mode:** lite
- **Epic:** 20261104-112537-session-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-04 11:25:37 +07:00
- **Updated:** 2026-11-04 13:37:16 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Dựng task completed hợp lệ trong test cần completedAt, tiêu chí met kèm evidence và checkpoint finishing; thiếu builder nên phải thử sai nhiều lần (lỗi 'Completed task is missing completion requirements').

## Relevant paths

- `test/support/builders.ts`
- `test/unit/core/doctor/archived-tasks.test.ts`
- `test/unit/core/doctor/project-tasks.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/batch.ts` | modified | +2 / -1 |
| `src/core/workflow/cancel.ts` | modified | +2 / -1 |
| `src/core/workflow/criterion.ts` | modified | +2 / -1 |
| `src/core/workflow/evidence-flags.ts` | modified | +2 / -1 |
| `src/core/workflow/evidence.ts` | modified | +2 / -1 |
| `src/core/workflow/finish.ts` | modified | +5 / -2 |
| `src/core/workflow/learn.ts` | modified | +2 / -1 |
| `src/core/workflow/migrate-v3.ts` | modified | +2 / -1 |
| `src/core/workflow/no-active-task.ts` | added | - |
| `src/core/workflow/plan-edit.ts` | modified | +2 / -1 |
| `src/core/workflow/plan-sync.ts` | modified | +2 / -1 |
| `src/core/workflow/reset-breaker.ts` | modified | +2 / -1 |
| `src/core/workflow/run-check.ts` | modified | +2 / -1 |
| `src/core/workflow/run-checks.ts` | modified | +2 / -1 |
| `src/core/workflow/snapshot.ts` | modified | +2 / -1 |
| `src/core/workflow/transition-hints.ts` | added | - |
| `src/core/workflow/transition.ts` | modified | +5 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/support/builders.ts` | modified | +12 / -0 |
| `test/unit/core/doctor/archived-tasks.test.ts` | modified | +2 / -11 |
| `test/unit/core/doctor/project-tasks.test.ts` | modified | +2 / -5 |
| `test/unit/core/workflow/finish.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/no-active-task.test.ts` | added | - |
| `test/unit/core/workflow/transition-hints.test.ts` | added | - |
| `test/workflow/builders.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): test/support/builders.ts có buildCompletedTaskV3 (task completed hợp lệ, cho phép ghi đè), hai test doctor mới nhất (archived-tasks và project-tasks) dùng nó thay cho đoạn dựng tay, và test của builder xác nhận validateTask chấp nhận kết quả.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-04 13:36:04 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-04 13:37:11 +07:00)

## Decisions

- **dec-dev-bump** — Bump 2.27.0-dev.2 (sau transition-status-hint dev.1); không đóng epic.
  - _Why:_ Chính sách version của epic.

## Evidence

- `chk-focus` — pass (2026-11-04 13:36:04 +07:00): pnpm exec vitest run test/unit/core/doctor test/workflow/builders.test.ts — exit 0
- `chk-suite` — pass (2026-11-04 13:37:11 +07:00): pnpm test — exit 0
