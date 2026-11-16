# Thứ tự check chỉ dựa trên thời lượng của lần chạy pass

- **ID:** 20261116-135352-check-order-pass-only
- **Mode:** lite
- **Epic:** 20261116-135351-upstream-review-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-16 13:53:51 +07:00
- **Updated:** 2026-11-16 14:55:25 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Thời lượng dùng để xếp check rẻ trước chỉ lấy từ lần chạy pass, và durationMs trong task.json phải là số nguyên không âm trong giới hạn hợp lý.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.

## Relevant paths

- `src/core/workflow/check-order.ts`
- `src/core/workflow/run-check.ts`
- `src/core/tasks/task-validate.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/tasks/task-validate.ts` | modified | +8 / -1 |
| `src/core/workflow/check-order.ts` | modified | +4 / -3 |
| `src/core/workflow/run-checks.ts` | modified | +1 / -1 |
| `src/core/workflow/schema.ts` | modified | +1 / -1 |
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
| `test/unit/core/tasks/task-validate-contracts.test.ts` | modified | +3 / -2 |
| `test/unit/core/workflow/check-order.test.ts` | modified | +18 / -1 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): Một check crash nhanh (evidence fail với durationMs nhỏ) không làm check đắt bị xếp trước check rẻ: chỉ evidence pass được tính thời lượng.
- [x] `ac-2` (met): durationMs không phải số nguyên không âm hoặc vượt giới hạn trên bị task-validate từ chối, kể cả khi đến từ payload --save.

## Required checks

- [x] `chk-1` (focused): Test tập trung của check-order-pass-only — pass (2026-11-16 14:53:31 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-16 14:54:58 +07:00)

## Evidence

- `chk-1` — pass (2026-11-16 14:53:31 +07:00): pnpm exec vitest run test/unit/core/workflow/check-order.test.ts test/unit/core/workflow/run-checks.test.ts test/unit/core/tasks — exit 0
- `chk-2` — pass (2026-11-16 14:54:58 +07:00): pnpm test — exit 0
