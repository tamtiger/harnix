# Quy ước task đóng epic là task cuối theo thứ tự epic

- **ID:** 20261104-114422-epic-closer-by-order
- **Mode:** lite
- **Epic:** 20261104-112537-session-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-04 11:44:22 +07:00
- **Updated:** 2026-11-04 13:40:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

AGENTS.md, skill harnix-implement, reference gates của harnix-verify và template workflow.md đang ghi 'the last member by ID closes the epic', trong khi ID chỉ là nhãn tạo sau và thứ tự epic (--epic-order) mới là kế hoạch thật; đổi quy ước thành task cuối theo thứ tự epic đóng epic.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
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
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/gates.md` | modified | +1 / -1 |
| `src/templates/harnix/workflow.md` | modified | +1 / -1 |
| `test/support/builders.ts` | modified | +12 / -0 |
| `test/unit/core/doctor/archived-tasks.test.ts` | modified | +2 / -11 |
| `test/unit/core/doctor/project-tasks.test.ts` | modified | +2 / -5 |
| `test/unit/core/workflow/finish.test.ts` | modified | +1 / -1 |
| `test/unit/core/workflow/no-active-task.test.ts` | added | - |
| `test/unit/core/workflow/transition-hints.test.ts` | added | - |
| `test/workflow/builders.test.ts` | added | - |
| `test/workflow/docs-task-contract.test.ts` | modified | +3 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): AGENTS.md, src/skills/harnix-implement/SKILL.md, src/skills/harnix-verify/references/gates.md và src/templates/harnix/workflow.md cùng nêu rằng task cuối theo thứ tự epic (--epic-order) đóng epic bằng bản phát hành X.(Y+1).0, không còn cụm 'by ID'; test docs-task-contract buộc cả ba bề mặt có cụm 'epic order'; pnpm selfhost:sync đã chạy; SKILL.md vẫn trong ngân sách token và mỗi reference có một dòng trỏ tới nó.

## Required checks

- [x] `check-1` (focused): Kiểm chứng: Quy ước task đóng epic là task cuối theo thứ tự epic — pass (2026-11-04 13:38:47 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-04 13:39:57 +07:00)

## Decisions

- **dec-dev-bump** — Bump 2.27.0-dev.3 (sau completed-task-builder dev.2); không đóng epic.
  - _Why:_ Chính sách version của epic; task đóng epic là doctor-journal-finding-dedupe.

## Evidence

- `check-1` — pass (2026-11-04 13:38:47 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts test/workflow/instruction-budget.test.ts test/workflow/skill-sources.test.ts — exit 0
- `chk-suite` — pass (2026-11-04 13:39:57 +07:00): pnpm test — exit 0
