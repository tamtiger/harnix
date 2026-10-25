# Chong bao loi nham exitCode 0 va chuan hoa CRLF Windows

- **ID:** 20261025-125308-harness-output-tolerance-and-crlf-handling
- **Mode:** lite
- **Epic:** 20261025-123400-developer-resilience-and-workflow-refactor
- **Status:** completed/finishing
- **Created:** 2026-10-25 12:53:07 +07:00
- **Updated:** 2026-10-25 13:26:58 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Xu ly check-output khong bao launcherFailure khi exitCode 0 va bo sung huong dan CRLF git

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
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
| `src/skills/harnix-verify/references/evidence.md` | modified | +1 / -0 |
| `test/unit/core/workflow/check-output.test.ts` | modified | +10 / -0 |
| `test/unit/core/workflow/epic-context.test.ts` | added | - |
| `test/unit/core/workflow/facts-hint.test.ts` | added | - |
| `test/unit/core/workflow/preflight.test.ts` | modified | +3 / -2 |
| `test/workflow/crlf-guidance.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): check-output va check-runner khong danh dau loi launcher error khi exitCode la 0, bat ke noi dung stdout/stderr.
- [x] `ac-2` (met): Bao dam git diff --ignore-space-at-eol va .gitattributes duoc huong dan de tranh false-positive diff CRLF/LF tren Windows.

## Required checks

- [x] `check-suite` (full): Toàn bộ test suite phải xanh — pass (2026-10-25 13:26:54 +07:00)
- [x] `chk-unit-output` (focused): Kiem tra check output khong loi khi exitCode 0 — pass (2026-10-25 13:24:51 +07:00)
- [x] `chk-docs-crlf` (focused): Huong dan CRLF/LF trong evidence reference — pass (2026-10-25 13:24:54 +07:00)

## Evidence

- `chk-unit-output` — pass (2026-10-25 13:24:51 +07:00): pnpm vitest run test/unit/core/workflow/check-output.test.ts — exit 0
- `chk-docs-crlf` — pass (2026-10-25 13:24:54 +07:00): pnpm vitest run test/workflow/crlf-guidance.test.ts — exit 0
- `check-suite` — pass (2026-10-25 13:26:54 +07:00): pnpm test — exit 0
