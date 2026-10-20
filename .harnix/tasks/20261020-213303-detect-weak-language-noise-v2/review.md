# Bỏ qua ngôn ngữ weak khi đã có ngôn ngữ xác nhận

- **ID:** 20261020-213303-detect-weak-language-noise-v2
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-20 21:33:03 +07:00
- **Updated:** 2026-10-20 21:38:11 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Detect không gán ngôn ngữ chỉ từ file lẻ (weak) khi project đã có ngôn ngữ probable/confirmed

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/core/stack/detection.ts` | modified | +2 / -9 |
| `src/core/stack/language-selection.ts` | added | - |
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
| `test/unit/core/stack/language-selection.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Ngôn ngữ chỉ có bằng chứng weak bị loại khi đã có ngôn ngữ mạnh hơn; ngôn ngữ cấp project là hợp của các package

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-20 21:38:09 +07:00)
- [x] `check-focus` (focused): Spec language-selection — pass (2026-10-20 21:33:09 +07:00)

## Evidence

- `check-focus` — pass (2026-10-20 21:33:09 +07:00): pnpm exec vitest run test/unit/core/stack/language-selection.test.ts test/unit/core/stack/detection.test.ts — exit 0
- `check-suite` — pass (2026-10-20 21:38:09 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
