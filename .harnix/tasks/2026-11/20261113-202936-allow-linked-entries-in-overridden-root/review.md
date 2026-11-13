# Cho phép junction trong root user-global được override

- **ID:** 20261113-202936-allow-linked-entries-in-overridden-root
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-11-13 20:29:36 +07:00
- **Updated:** 2026-11-13 20:35:13 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 2/2 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Setup/update không còn lỗi 'escapes the user root through a symbolic link' khi CLAUDE_CONFIG_DIR/CODEX_HOME/XDG trỏ tới profile có entry con là junction/symlink tới đích nằm trong home đã xác minh; vẫn từ chối đích ngoài home và root là link thoát.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `src/core/platform/user-paths.ts` | modified | +27 / -5 |
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
| `test/unit/core/platform/user-paths.test.ts` | modified | +53 / -0 |

## Acceptance criteria

- [x] `ac-1` (met): Một entry con (junction/symlink) bên trong root được override bằng biến môi trường, có đích thật nằm trong home đã xác minh, được resolveSafeUserPath chấp nhận.
- [x] `ac-2` (met): Entry con có đích ngoài home đã xác minh, root mặc định (không override) có link thoát, và root override tự là link thoát khỏi anchor vẫn bị từ chối bằng UnsafeUserPathError.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-13 20:35:09 +07:00)
- [x] `chk-linked-focused` (focused): chk-linked-focused — pass (2026-11-13 20:33:13 +07:00)

## Evidence

- `chk-linked-focused` — pass (2026-11-13 20:33:13 +07:00): pnpm exec vitest run test/unit/core/platform/user-paths.test.ts --coverage.enabled=false — exit 0
- `check-suite` — pass (2026-11-13 20:35:09 +07:00): pnpm test — exit 0
