# Cải thiện hướng dẫn cấu trúc test mirror để tránh bẫy huỷ task

- **ID:** 20261021-101124-test-structure-guidance
- **Mode:** lite
- **Epic:** 20261021-101119-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-21 10:11:19 +07:00
- **Updated:** 2026-10-21 11:04:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Bổ sung hướng dẫn kiểm tra quy tắc mirror cấu trúc test file trong workflow guide và test-structure message

## Non-goals

- Không nới lỏng quy tắc mirror 1:1 của test-structure

## Relevant paths

- `test/README.md`
- `test/unit/test-structure.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +10 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/workflow/finish.ts` | modified | +33 / -1 |
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
| `src/templates/harnix/activation.ts` | modified | +2 / -2 |
| `src/templates/harnix/agents.ts` | modified | +1 / -1 |
| `src/utils/check-runner.ts` | modified | +19 / -4 |
| `test/README.md` | modified | +14 / -0 |
| `test/unit/core/journal/learned-blocks.test.ts` | modified | +72 / -0 |
| `test/unit/core/workflow/finish.test.ts` | modified | +28 / -30 |
| `test/unit/test-structure.test.ts` | modified | +32 / -6 |
| `test/unit/utils/check-runner.test.ts` | modified | +32 / -33 |
| `test/workflow/legacy-history.test.ts` | modified | +29 / -13 |

## Acceptance criteria

- [x] `ac-1` (met): Thông báo lỗi test-structure hướng dẫn rõ ràng cấu trúc đặt file theo mẫu cụ thể và test/README.md cập nhật giải thích cách đặt fixture/support

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-21 11:03:52 +07:00)
- [x] `check-structure` (focused): Chạy test cấu trúc test suite — pass (2026-10-21 11:02:19 +07:00)

## Evidence

- `check-structure` — pass (2026-10-21 11:02:19 +07:00): pnpm exec vitest run test/unit/test-structure.test.ts — exit 0
- `check-suite` — pass (2026-10-21 11:03:52 +07:00): pnpm test — exit 0
