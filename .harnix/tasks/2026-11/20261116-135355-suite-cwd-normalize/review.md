# Chuẩn hóa cwd khi so khớp lệnh suite với package

- **ID:** 20261116-135355-suite-cwd-normalize
- **Mode:** lite
- **Epic:** 20261116-135351-upstream-review-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-16 13:53:51 +07:00
- **Updated:** 2026-11-16 15:07:12 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

cwd của check suite dạng ./ hoặc pkg/. được chuẩn hóa trước khi so với đường dẫn package và so với '.', để lệnh test hợp lệ không bị từ chối.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.

## Relevant paths

- `src/core/workflow/suite-command.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +9 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/tasks/task-validate.ts` | modified | +8 / -1 |
| `src/core/workflow/check-order.ts` | modified | +4 / -3 |
| `src/core/workflow/init-default-inputs.ts` | modified | +12 / -2 |
| `src/core/workflow/init-lint-check.ts` | modified | +13 / -3 |
| `src/core/workflow/run-checks.ts` | modified | +1 / -1 |
| `src/core/workflow/schema.ts` | modified | +2 / -2 |
| `src/core/workflow/suite-command.ts` | modified | +16 / -2 |
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
| `test/unit/core/workflow/suite-command.test.ts` | modified | +24 / -0 |
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -2 |

## Acceptance criteria

- [x] `ac-1` (met): cwd `./` được hiểu là thư mục gốc và `packages/a/.` được hiểu là `packages/a` khi kiểm tra lệnh suite.
- [x] `ac-2` (met): Việc chuẩn hóa không nới lỏng kiểm tra an toàn: cwd có `..` hoặc đường dẫn tuyệt đối vẫn bị từ chối.

## Required checks

- [x] `chk-1` (focused): Test tập trung của suite-cwd-normalize — pass (2026-11-16 15:05:06 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-16 15:06:43 +07:00)

## Evidence

- `chk-1` — pass (2026-11-16 15:05:06 +07:00): pnpm exec vitest run test/unit/core/workflow/suite-command.test.ts test/unit/core/workflow/suite-gate.test.ts — exit 0
- `chk-2` — pass (2026-11-16 15:06:43 +07:00): pnpm test — exit 0
