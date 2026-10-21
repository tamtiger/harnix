# Tối ưu hiệu năng legacy-history.test.ts bằng fixture cô lập

- **ID:** 20261021-101121-legacy-history-performance
- **Mode:** lite
- **Epic:** 20261021-101119-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-21 10:11:19 +07:00
- **Updated:** 2026-10-21 10:41:04 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Chuyển legacy-history.test.ts sang đọc fixture đóng băng cô lập để giảm thời gian chạy từ 13.7s xuống <1s

## Non-goals

- Không xóa các bài kiểm tra tương thích ngược của schema v1/v2

## Relevant paths

- `test/support/fixtures/**`
- `test/workflow/legacy-history.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
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
| `test/workflow/legacy-history.test.ts` | modified | +29 / -13 |

## Acceptance criteria

- [x] `ac-1` (met): legacy-history.test.ts chạy trong <1 giây dùng fixture cô lập đặt tại test/support/fixtures/ và khởi tạo một lần trong beforeAll, loại bỏ nhu cầu nới lỏng timeout 90s

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-21 10:40:47 +07:00)
- [x] `check-history` (focused): Chạy test legacy history tối ưu và kiểm tra không có stray test files — pass (2026-10-21 10:39:09 +07:00)

## Evidence

- `check-history` — pass (2026-10-21 10:39:09 +07:00): pnpm exec vitest run test/workflow/legacy-history.test.ts test/unit/test-structure.test.ts — exit 0
- `check-suite` — pass (2026-10-21 10:40:47 +07:00): pnpm test — exit 0
