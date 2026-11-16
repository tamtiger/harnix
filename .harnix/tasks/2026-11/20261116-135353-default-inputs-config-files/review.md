# Input mặc định của check suite gồm các file cấu hình gốc

- **ID:** 20261116-135353-default-inputs-config-files
- **Mode:** lite
- **Epic:** 20261116-135351-upstream-review-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-16 13:53:51 +07:00
- **Updated:** 2026-11-16 14:59:46 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Input mặc định đã thu hẹp của check suite và check-lint phải đổi digest khi sửa file cấu hình test, lint, lockfile hoặc solution ở thư mục gốc.

## Non-goals

- Không đổi frozen contract ngoài phạm vi member này.

## Relevant paths

- `src/core/workflow/init-default-inputs.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/tasks/task-validate.ts` | modified | +8 / -1 |
| `src/core/workflow/check-order.ts` | modified | +4 / -3 |
| `src/core/workflow/init-default-inputs.ts` | modified | +12 / -2 |
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
| `test/workflow/behavior-snapshot.golden.json` | modified | +2 / -2 |

## Acceptance criteria

- [x] `ac-1` (met): Sửa vitest.config.ts, eslint.config.mjs, pnpm-lock.yaml, một file *.sln hoặc Directory.Build.props ở gốc làm đổi digest của check suite mặc định.
- [x] `ac-2` (met): Các input mặc định vẫn thu hẹp: không quay về wildcard toàn repository và không kéo thêm thư mục build hoặc dữ liệu.

## Required checks

- [x] `chk-1` (focused): Test tập trung của default-inputs-config-files — pass (2026-11-16 14:58:06 +07:00)
- [x] `chk-2` (full): Bộ test toàn dự án — pass (2026-11-16 14:59:41 +07:00)

## Evidence

- `chk-1` — pass (2026-11-16 14:58:06 +07:00): pnpm exec vitest run test/unit/core/workflow/init-default-inputs.test.ts test/unit/core/workflow/init-task.test.ts — exit 0
- `chk-2` — pass (2026-11-16 14:59:41 +07:00): pnpm test — exit 0
