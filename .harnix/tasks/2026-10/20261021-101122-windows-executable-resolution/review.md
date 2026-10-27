# Tra cứu PATH cho executable có đuôi mở rộng trên Windows

- **ID:** 20261021-101122-windows-executable-resolution
- **Mode:** lite
- **Epic:** 20261021-101119-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-21 10:11:19 +07:00
- **Updated:** 2026-10-21 10:50:19 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

check-runner tra cứu đường dẫn đầy đủ trên PATH cho executable có phần mở rộng (.exe, .com) trên Windows để tránh libuv tìm trong cwd

## Non-goals

- Không phá vỡ việc thực thi lệnh nội trang cmd và wrapper script

## Relevant paths

- `src/utils/check-runner.ts`
- `test/unit/utils/check-runner.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +18 / -0 |
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
| `src/utils/check-runner.ts` | modified | +19 / -4 |
| `test/unit/utils/check-runner.test.ts` | modified | +32 / -33 |
| `test/workflow/legacy-history.test.ts` | modified | +29 / -13 |

## Acceptance criteria

- [x] `ac-1` (met): Lệnh có đuôi như pwsh.exe hoặc git.exe được findOnPath nhận diện đúng extension và resolveInvocation trả về đường dẫn tuyệt đối; test case cũ tại check-runner.test.ts được cập nhật tương ứng

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-21 10:49:57 +07:00)
- [x] `check-runner` (focused): Chạy test kiểm tra check-runner trên Windows và POSIX — pass (2026-10-21 10:48:31 +07:00)

## Evidence

- `check-runner` — pass (2026-10-21 10:48:31 +07:00): pnpm exec vitest run test/unit/utils/check-runner.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-21 10:49:57 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
