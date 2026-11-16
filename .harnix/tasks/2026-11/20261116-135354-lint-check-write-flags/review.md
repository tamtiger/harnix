# Check-lint chỉ đọc nhận diện cờ ghi file viết tắt

- **ID:** 20261116-135354-lint-check-write-flags
- **Mode:** lite
- **Epic:** 20261116-135351-upstream-review-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-16 13:53:51 +07:00
- **Updated:** 2026-11-16 15:03:28 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Lệnh lint có cờ ghi file như -w hoặc --fix nằm trong script được nối không được khai báo thành check-lint chỉ đọc.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.

## Relevant paths

- `src/core/workflow/init-lint-check.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +18 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/tasks/task-validate.ts` | modified | +8 / -1 |
| `src/core/workflow/check-order.ts` | modified | +4 / -3 |
| `src/core/workflow/init-default-inputs.ts` | modified | +12 / -2 |
| `src/core/workflow/init-lint-check.ts` | modified | +13 / -3 |
| `src/core/workflow/run-checks.ts` | modified | +1 / -1 |
| `src/core/workflow/schema.ts` | modified | +2 / -2 |
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
| `test/unit/core/workflow/init-default-inputs.test.ts` | modified | +45 / -0 |
| `test/unit/core/workflow/init-lint-check.test.ts` | modified | +24 / -0 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -2 |

## Acceptance criteria

- [x] `ac-1` (met): Lệnh như `prettier -w .` bị coi là ghi file và không được khai báo thành check-lint chỉ đọc.
- [x] `ac-2` (met): Cờ --fix hoặc --write nằm trong một script được nối bằng && hoặc ; cũng loại cả lệnh khỏi check-lint chỉ đọc.

## Required checks

- [x] `chk-1` (focused): Test tập trung của lint-check-write-flags — pass (2026-11-16 15:01:43 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-16 15:03:23 +07:00)

## Evidence

- `chk-1` — pass (2026-11-16 15:01:43 +07:00): pnpm exec vitest run test/unit/core/workflow/init-lint-check.test.ts — exit 0
- `chk-2` — pass (2026-11-16 15:03:23 +07:00): pnpm test — exit 0
