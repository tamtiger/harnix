# Uninstall không xóa junction/symlink của profile và doctor cảnh báo file dùng chung

- **ID:** 20261113-220241-uninstall-link-safety
- **Mode:** lite
- **Epic:** 20261113-220240-harnix-review-hardening
- **Status:** completed/finishing
- **Created:** 2026-11-13 22:02:39 +07:00
- **Updated:** 2026-11-13 22:12:59 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Sau khi cho phép junction con trong root override (2.32.4), uninstall và doctor phải xử lý đúng các link đó: không xóa link, và phát hiện khi hai manifest cùng sở hữu một file vật lý.

## Non-goals

- Không thu hẹp lại linkBoundary (S3) và không đổi hành vi root mặc định (S4).

## Relevant paths

- `src/core/global/uninstall.ts`
- `src/core/doctor`
- `src/core/platform/user-paths.ts`

## Relevant specs

- `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/doctor/finding-codes-global.ts` | modified | +1 / -0 |
| `src/core/doctor/global-inspect.ts` | modified | +5 / -1 |
| `src/core/doctor/global-linked.ts` | added | - |
| `src/core/global/uninstall.ts` | modified | +4 / -1 |
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
| `test/unit/core/doctor/global-inspect.test.ts` | modified | +28 / -1 |
| `test/unit/core/doctor/global-linked.test.ts` | added | - |
| `test/unit/core/global/uninstall.test.ts` | modified | +32 / -1 |

## Acceptance criteria

- [x] `ac-1` (met): removeEmptyDirectory kiểm tra lstat và bỏ qua symlink/junction, nên uninstall --global không xóa junction của profile (S1); có test hồi quy trên Windows (junction) và POSIX (symlink).
- [x] `ac-2` (met): doctor có finding mức warning mới trong DOCTOR_FINDING_CODES, kèm fixture, khi realpath của một file managed nằm ngoài root logic hoặc hai manifest cùng sở hữu một file vật lý (S2).

## Required checks

- [x] `chk-focused` (focused): Test uninstall và doctor global — pass (2026-11-13 22:10:38 +07:00)
- [x] `check-suite` (full): Toàn bộ bộ test của dự án — pass (2026-11-13 22:12:48 +07:00)

## Decisions

- **dec-source** — Nguồn của task: báo cáo review toàn bộ Harnix ngày 2026-11-13 (research.md của epic).
  - _Why:_ Mỗi tiêu chí là một phát hiện đã được nhóm review nêu kèm file:dòng; phải đối chiếu lại với mã hiện tại trước khi chuyển sang ready.

## Evidence

- `chk-focused` — pass (2026-11-13 22:10:38 +07:00): pnpm exec vitest run test/unit/core/global test/unit/core/doctor --coverage.enabled=false — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-13 22:12:48 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
