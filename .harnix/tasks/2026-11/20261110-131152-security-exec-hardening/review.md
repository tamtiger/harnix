# Gia cố thực thi tiến trình ngoài (git, launcher, timeout)

- **ID:** 20261110-131152-security-exec-hardening
- **Mode:** full
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 13:27:29 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Loại bỏ nguy cơ chạy executable giả nằm trong cwd hoặc repo khi gọi git và harnix launcher, sửa exit code khi timeout và dọn cây tiến trình, mà không đổi hành vi công khai.

## Non-goals

- Không đổi cách --run-check khai báo command và cwd
- Không thêm phụ thuộc mới

## Relevant paths

- `src/utils/check-runner.ts`
- `src/utils/git.ts`
- `src/utils/harnix-launcher.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +28 / -28 |
| `package.json` | modified | +1 / -1 |
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
| `src/utils/check-runner.ts` | modified | +27 / -5 |
| `src/utils/git.ts` | modified | +18 / -1 |
| `src/utils/harnix-launcher.ts` | modified | +13 / -11 |
| `src/utils/process-group.ts` | added | - |
| `test/safety/process-timeout.test.ts` | added | - |
| `test/unit/utils/check-runner.test.ts` | modified | +1 / -1 |
| `test/unit/utils/git.test.ts` | modified | +48 / -4 |
| `test/unit/utils/harnix-launcher.test.ts` | modified | +18 / -6 |
| `test/unit/utils/process-group.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): git.ts và harnix-launcher.ts tìm executable qua PATH tuyệt đối (findOnPath hoặc systemExecutable) và không chạy tệp cùng tên trong cwd; có test hồi quy dùng thư mục chứa git.exe hoặc harnix.cmd giả.
- [x] `ac-2` (met): check-runner trả exitCode 124 khi timeout, kể cả khi taskkill làm sự kiện close mang code khác null; có test.
- [x] `ac-3` (met): killProcessTree dọn cả tiến trình con trên POSIX và output đa byte không bị cắt đôi ký tự (StringDecoder); có test.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 13:27:24 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 13:27:06 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-10 13:27:24 +07:00): pnpm exec vitest run test/unit/utils — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-10 13:27:06 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
