# Lỗi transition, finish và thiếu task active có hint nêu lệnh đúng

- **ID:** 20261104-112538-transition-status-hint
- **Mode:** lite
- **Epic:** 20261104-112537-session-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-04 11:25:37 +07:00
- **Updated:** 2026-11-04 13:34:03 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Gõ nhầm --transition finishing/finishing, gọi --finish sai checkpoint hoặc chạy lệnh khi chưa có task active chỉ nhận message mà không có hint nêu lệnh đúng, trái hợp đồng lỗi CLI luôn có hint nêu lệnh đã sửa.

## Relevant paths

- `src/commands/workflow-handlers.ts`
- `test/unit/commands/workflow-handlers.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
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
| `test/unit/core/workflow/finish.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/no-active-task.test.ts` | added | - |
| `test/unit/core/workflow/transition-hints.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): workflow --transition <checkpoint>/<x> với phần đầu là tên checkpoint chứ không phải status trả lỗi có hint nêu status sở hữu checkpoint đó (finishing -> verifying/finishing, implementing -> in_progress/implementing), vẫn liệt kê status hợp lệ khi phần đầu là chuỗi lạ; test cho cả hai trường hợp và các lỗi transition khác không đổi.
- [x] `ac-2` (met): Lỗi 'requires an active task' của workflow --transition, --plan-edit và các action tương tự có hint nêu cách chọn task (harnix resume <id>, harnix tasks hoặc workflow --init), và lỗi --finish khi task chưa ở checkpoint finishing có hint nêu workflow --transition verifying/finishing; test cho từng lỗi, không đổi message hiện có.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-04 13:32:22 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-04 13:33:36 +07:00)

## Decisions

- **dec-dev-bump** — Task đầu của epic code bump 2.27.0-dev.1; completed-task-builder bump 2.27.0-dev.2; doctor-journal-finding-dedupe đóng epic 2.27.0 với --fold-dev.
  - _Why:_ Chính sách version của epic: member bump X.Y.0-dev.N, task cuối theo thứ tự đóng epic.

## Evidence

- `chk-focus` — pass (2026-11-04 13:32:22 +07:00): pnpm exec vitest run test/unit/commands/workflow-handlers.test.ts test/integration/commands/workflow-handlers.test.ts test/workflow/cli-contract.test.ts — exit 0
- `chk-suite` — pass (2026-11-04 13:33:36 +07:00): pnpm test — exit 0
