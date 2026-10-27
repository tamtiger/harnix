# Chi dan factsHint khi facts stale va kiem soat goi y epic cu trong preflight

- **ID:** 20261025-123540-preflight-facts-hint-and-epic-context-quieting
- **Mode:** lite
- **Epic:** 20261025-123400-developer-resilience-and-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-10-25 12:35:40 +07:00
- **Updated:** 2026-10-25 13:23:35 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Chi dan factsHint khi facts stale va kiem soat goi y epic cu trong preflight

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/epic-context.ts` | added | - |
| `src/core/workflow/facts-hint.ts` | added | - |
| `src/core/workflow/preflight.ts` | modified | +7 / -42 |
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
| `test/unit/core/workflow/epic-context.test.ts` | added | - |
| `test/unit/core/workflow/facts-hint.test.ts` | added | - |
| `test/unit/core/workflow/preflight.test.ts` | modified | +3 / -2 |

## Acceptance criteria

- [x] `ac-1` (met): Preflight tra ve truong factsHint neu projectFactsStale la true voi noi dung ro rang huong dan chay harnix facts --refresh va neu ro khong ghi de task state.
- [x] `ac-2` (met): Preflight khong tu dong nhac resume cac epic cu khong lien quan khi dang khong co active task hoac ho tro che do giam nhieu.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-25 13:11:09 +07:00)
- [x] `chk-unit-preflight` (focused): Kiem thu preflight factsHint va epic context quieting — pass (2026-10-25 13:09:03 +07:00)

## Evidence

- `chk-unit-preflight` — pass (2026-10-25 13:09:03 +07:00): pnpm vitest run test/unit/core/workflow/preflight.test.ts — exit 0 _(4 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-25 13:11:09 +07:00): pnpm test — exit 0 _(3 earlier reruns not shown; see task.json for full history)_
