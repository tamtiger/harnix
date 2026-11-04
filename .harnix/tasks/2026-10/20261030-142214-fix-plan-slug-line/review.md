# Sửa dòng 444 bị hỏng của IMPLEMENTATION_PLAN

- **ID:** 20261030-142214-fix-plan-slug-line
- **Mode:** lite
- **Epic:** 20261030-142214-dev-maintenance
- **Status:** completed/finishing
- **Created:** 2026-10-30 14:22:14 +07:00
- **Updated:** 2026-10-30 16:21:59 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Khôi phục mục (10) về --slug trong docs/IMPLEMENTATION_PLAN.md: dòng 444 bị chèn nhầm tiêu đề tài liệu và mất phần cuối của mục, có từ v2.22.1.

## Non-goals

- Không viết lại các mục khác của IMPLEMENTATION_PLAN.

## Relevant paths

- `docs/IMPLEMENTATION_PLAN.md`
- `src/core/workflow/init-task.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
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
| `test/README.md` | modified | +2 / -0 |
| `test/workflow/implementation-plan-integrity.test.ts` | added | - |
| `test/workflow/measure-footprint-guard.test.ts` | modified | +8 / -34 |
| `vitest.config.ts` | modified | +4 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Mục (10) của dòng 444 nêu đầy đủ quy tắc slug (regex, giới hạn độ dài, --slug bắt buộc khi title có ký tự ngoài ASCII) theo init-task.ts, và dòng không còn chứa chuỗi '# Harnix Implementation Plan'; tiêu đề tài liệu chỉ xuất hiện ở dòng 1.

## Required checks

- [x] `chk-docs` (focused): Các test hợp đồng tài liệu và so khớp release sequence — pass (2026-10-30 16:20:12 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 16:21:29 +07:00)

## Decisions

- **also-888** — Bản thứ hai của đoạn văn (dòng 888, mục 4.11) cũng bị hỏng đối xứng (mất phần đầu mục (10)); đã khôi phục cả hai từ phần còn nguyên của nhau.
  - _Why:_ Hai bản cùng một lần splice hỏng; sửa một bản sẽ để lại bản kia sai.

## Evidence

- `chk-docs` — pass (2026-10-30 16:20:12 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-10-30 16:21:29 +07:00): pnpm test — exit 0
