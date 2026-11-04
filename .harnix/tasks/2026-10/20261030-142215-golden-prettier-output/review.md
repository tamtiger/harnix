# Golden ghi đúng định dạng Prettier

- **ID:** 20261030-142215-golden-prettier-output
- **Mode:** lite
- **Epic:** 20261030-142214-dev-maintenance
- **Status:** completed/finishing
- **Created:** 2026-10-30 14:22:14 +07:00
- **Updated:** 2026-10-30 16:26:19 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

HARNIX_UPDATE_GOLDEN=1 hiện ghi JSON thụt lề 2 và làm phình diff cả trăm dòng; phải ghi đúng định dạng Prettier của repo để diff chỉ còn thay đổi thật.

## Non-goals

- Không đổi cách so sánh golden hay quy tắc cấm cập nhật khi CI.

## Relevant paths

- `test/workflow/behavior-snapshot.test.ts`
- `test/workflow/behavior-snapshot.golden.json`
- `test/README.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +2 / -2 |
| `docs/HARNIX_PRD.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +5 / -5 |
| `docs/UPSTREAM_BASELINE.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/footprint-budget.json` | deleted | +0 / -1 |
| `scripts/footprint-budget.mjs` | deleted | +0 / -25 |
| `scripts/measure-footprint.mjs` | modified | +0 / -4 |
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
| `test/README.md` | modified | +4 / -0 |
| `test/support/golden-format.ts` | added | - |
| `test/workflow/behavior-snapshot.test.ts` | modified | +2 / -1 |
| `test/workflow/golden-format.test.ts` | added | - |
| `test/workflow/implementation-plan-integrity.test.ts` | added | - |
| `test/workflow/measure-footprint-guard.test.ts` | modified | +8 / -34 |
| `vitest.config.ts` | modified | +4 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Khi HARNIX_UPDATE_GOLDEN=1, behavior-snapshot ghi golden bằng định dạng Prettier của repo (parser json); chạy lại trên code không đổi không làm git diff của golden thay đổi, và một thay đổi một chuỗi chỉ tạo diff một dòng. Có test cho hàm định dạng.

## Required checks

- [x] `chk-golden` (focused): Test golden và hàm định dạng — pass (2026-10-30 16:24:08 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 16:25:48 +07:00)

## Evidence

- `chk-golden` — pass (2026-10-30 16:24:08 +07:00): pnpm exec vitest run test/workflow/behavior-snapshot.test.ts — exit 0
- `chk-suite` — pass (2026-10-30 16:25:48 +07:00): pnpm test — exit 0
