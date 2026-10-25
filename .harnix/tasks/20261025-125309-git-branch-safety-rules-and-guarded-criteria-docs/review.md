# Cuong che quy tac kiem tra nhanh truoc commit va hoan thien Guarded Replanning

- **ID:** 20261025-125309-git-branch-safety-rules-and-guarded-criteria-docs
- **Mode:** lite
- **Epic:** 20261025-123400-developer-resilience-and-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-10-25 12:53:07 +07:00
- **Updated:** 2026-10-25 13:30:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Them quy tac bat buoc kiem tra git branch --show-current truoc commit, cam pipe git checkout va hoan thien huong dan Guarded Replanning

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
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
| `test/unit/core/workflow/check-output.test.ts` | modified | +10 / -0 |
| `test/unit/core/workflow/epic-context.test.ts` | added | - |
| `test/unit/core/workflow/facts-hint.test.ts` | added | - |
| `test/unit/core/workflow/preflight.test.ts` | modified | +3 / -2 |
| `test/workflow/crlf-guidance.test.ts` | added | - |
| `test/workflow/git-safety-guidance.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): AGENTS.md va skills cuong che kiem tra git branch --show-current va cam pipe git checkout truoc khi commit.
- [x] `ac-2` (met): Tai lieu va huong dan workflow lam ro co che thay the criterion/waive giup developer khong phai sua text thu cong.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite phải xanh — pass (2026-10-25 13:30:05 +07:00)
- [x] `chk-agents-rule` (focused): Quy tac git safety va huong dan thay the/waive criterion — pass (2026-10-25 13:28:04 +07:00)

## Evidence

- `chk-agents-rule` — pass (2026-10-25 13:28:04 +07:00): pnpm vitest run test/workflow/git-safety-guidance.test.ts — exit 0
- `check-suite` — pass (2026-10-25 13:30:05 +07:00): pnpm test — exit 0
