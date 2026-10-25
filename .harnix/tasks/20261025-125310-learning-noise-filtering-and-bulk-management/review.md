# Loc nhieu learning tu sinh va them lenh quan tri hang loat

- **ID:** 20261025-125310-learning-noise-filtering-and-bulk-management
- **Mode:** lite
- **Epic:** 20261025-123400-developer-resilience-and-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-10-25 12:53:07 +07:00
- **Updated:** 2026-10-25 13:35:50 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Nang cap bo loc learning loai bo observation rac va bo sung thao tac hang loat cho CLI learning

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +3 / -3 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/cli-workflow-commands.ts` | modified | +2 / -2 |
| `src/commands/learning.ts` | modified | +42 / -2 |
| `src/core/journal/learning-prune.ts` | modified | +6 / -3 |
| `src/core/journal/learning-quality.ts` | modified | +6 / -3 |
| `src/core/workflow/epic-context.ts` | added | - |
| `src/core/workflow/facts-hint.ts` | added | - |
| `src/core/workflow/preflight.ts` | modified | +7 / -42 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-implement/references/commit-hygiene.md` | modified | +4 / -0 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/replan.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/evidence.md` | modified | +1 / -0 |
| `test/integration/commands/learning.test.ts` | modified | +12 / -0 |
| `test/unit/core/journal/learning-prune.test.ts` | modified | +14 / -0 |
| `test/unit/core/journal/learning-quality.test.ts` | modified | +6 / -0 |
| `test/unit/core/workflow/check-output.test.ts` | modified | +10 / -0 |
| `test/unit/core/workflow/epic-context.test.ts` | added | - |
| `test/unit/core/workflow/facts-hint.test.ts` | added | - |
| `test/unit/core/workflow/preflight.test.ts` | modified | +3 / -2 |
| `test/workflow/crlf-guidance.test.ts` | added | - |
| `test/workflow/git-safety-guidance.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Bo loc learning tu sinh tu choi cac candidate la nhan text UI/code cuc bo hoac qua ngan.
- [x] `ac-2` (met): Lenh harnix learning ho tro thao tac reject/retire hang loat cho cac draft khong hop le.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite phải xanh — pass (2026-10-25 13:35:45 +07:00)
- [x] `chk-unit-learning` (focused): Loc learning rac va thao tac hang loat — pass (2026-10-25 13:33:47 +07:00)

## Evidence

- `chk-unit-learning` — pass (2026-10-25 13:33:47 +07:00): pnpm vitest run test/unit/core/journal/learning-quality.test.ts test/unit/core/journal/learning-prune.test.ts test/integration/commands/learning.test.ts — exit 0
- `check-suite` — pass (2026-10-25 13:35:45 +07:00): pnpm test — exit 0
