# Tự động phục hồi Mojibake thành UTF-8 chuẩn trên Windows Stdin

- **ID:** 20261024-100326-auto-repair-mojibake-windows-stdin
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-10-24 10:03:26 +07:00
- **Updated:** 2026-10-24 10:18:16 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Tự động phát hiện và khôi phục chuỗi bị méo mã hóa do Windows PowerShell 5.1/CP1252/CP1258 thành UTF-8 chuẩn tại tầng bounded input và workflow handlers

## Relevant paths

- `src/core/workflow/text-integrity.ts,src/utils/bounded-input.ts,src/commands/workflow-handler-utils.ts,test/unit/core/workflow/text-integrity.test.ts,test/unit/utils/bounded-input.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +24 / -24 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/text-integrity.ts` | modified | +6 / -39 |
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
| `src/utils/bounded-input.ts` | modified | +9 / -5 |
| `src/utils/text-repair.ts` | added | - |
| `test/unit/commands/workflow-handler-utils.test.ts` | modified | +8 / -1 |
| `test/unit/core/workflow/text-integrity.test.ts` | modified | +32 / -1 |
| `test/unit/utils/bounded-input.test.ts` | modified | +8 / -0 |
| `test/unit/utils/text-repair.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): autoRepairMojibake khôi phục chuỗi méo mã hóa CP1252/CP1258 thành tiếng Việt UTF-8 chuẩn mà không ném lỗi
- [x] `ac-2` (met): readBoundedInput và readInput tự động áp dụng autoRepairMojibake cho payload stdin trước khi parse JSON

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-24 10:15:38 +07:00)
- [x] `chk-unit-text-integrity` (focused): chk-unit-text-integrity — pass (2026-10-24 10:16:02 +07:00)
- [x] `chk-unit-bounded-input` (focused): chk-unit-bounded-input — pass (2026-10-24 10:15:55 +07:00)

## Evidence

- `chk-unit-text-integrity` — pass (2026-10-24 10:16:02 +07:00): pnpm vitest run test/unit/core/workflow/text-integrity.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-unit-bounded-input` — pass (2026-10-24 10:15:55 +07:00): pnpm vitest run test/unit/utils/bounded-input.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-24 10:15:38 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
