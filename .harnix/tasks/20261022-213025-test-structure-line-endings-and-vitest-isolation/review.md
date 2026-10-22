# Gia cố Test Suite Structure, Line Endings và Vitest Concurrency Isolation

- **ID:** 20261022-213025-test-structure-line-endings-and-vitest-isolation
- **Mode:** lite
- **Epic:** 20261022-213024-workflow-ergonomics-and-codebase-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-22 21:30:25 +07:00
- **Updated:** 2026-10-22 21:50:14 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 4/4 passed |

## Goal

Cải tiến logic đếm dòng trong test-structure.test.ts đếm lines of code thực tế (bỏ qua dòng trống và comments tương tự architecture.test.ts), hạ nhiệt 19 file test sát trần 400 dòng; bổ sung file .gitattributes eol=lf và Prettier endOfLine='lf' chấm dứt lỗi format trên Windows; cố định pool: 'forks' trong vitest.config.ts và bổ sung describe.sequential cho toàn bộ 26 test files có gọi process.chdir().

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `.gitattributes` | added | - |
| `.prettierrc.json` | modified | +1 / -2 |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `eslint.config.mjs` | modified | - |
| `package.json` | modified | +1 / -1 |
| `scripts/assert-built.mjs` | modified | - |
| `scripts/changelog-fold.mjs` | modified | - |
| `scripts/measure-footprint.mjs` | modified | - |
| `scripts/measure-init.mjs` | modified | - |
| `scripts/measure-tokens.mjs` | modified | - |
| `scripts/pack-check.mjs` | modified | - |
| `scripts/scan-release-assertions.mjs` | modified | - |
| `scripts/scan-release.mjs` | modified | - |
| `scripts/scan-secrets.mjs` | modified | - |
| `scripts/setup-exit-contract.mjs` | modified | - |
| `scripts/smoke-tarball.mjs` | modified | - |
| `scripts/version-sync.mjs` | modified | - |
| `src/catalog/catalog.ts` | modified | - |
| `src/catalog/languages.ts` | modified | - |
| `src/catalog/technologies.ts` | modified | - |
| `src/catalog/types.ts` | modified | - |
| `src/catalog/validation-helpers.ts` | modified | - |
| `src/catalog/validation.ts` | modified | - |
| `src/cli-helpers.ts` | modified | - |
| `src/cli-program.ts` | modified | - |
| `src/cli-project-commands.ts` | modified | - |
| `src/cli-workflow-commands.ts` | modified | - |
| `src/cli.ts` | modified | - |
| `src/commands/audit.ts` | modified | - |
| `src/commands/checks.ts` | modified | - |
| `src/commands/context-report.ts` | modified | - |
| `src/commands/doctor.ts` | modified | - |
| `src/commands/global-doctor.ts` | modified | - |
| `src/commands/global-uninstall.ts` | modified | - |
| `src/commands/global-update.ts` | modified | - |
| `src/commands/init.ts` | modified | - |
| `src/commands/internal-context-cli.ts` | modified | - |
| `src/commands/internal-context.ts` | modified | - |
| `src/commands/learning.ts` | modified | - |
| `src/commands/legacy-project-surfaces.ts` | modified | - |
| `src/commands/mem.ts` | modified | - |
| `src/commands/pause.ts` | modified | - |
| `src/commands/repo-map-internal.ts` | modified | - |
| `src/commands/resume.ts` | modified | - |
| `src/commands/setup.ts` | modified | - |
| `src/commands/status.ts` | modified | - |
| `src/commands/tasks.ts` | modified | - |
| `src/commands/uninstall.ts` | modified | - |
| `src/commands/update.ts` | modified | - |

_(485 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Cải tiến logic đo độ dài file test trong test-structure.test.ts để đếm số dòng code thực tế (bỏ qua dòng trống và comments tương tự như architecture.test.ts), giúp ngăn chặn vỡ test khi chạy prettier và hạ nhiệt 19 file test đang sát trần 400 dòng.
- [x] `ac-2` (met): Bổ sung file .gitattributes chuẩn hóa eol=lf cho mã nguồn và text scripts; cấu hình Prettier endOfLine='lf' để chấm dứt tình trạng lệch dòng CRLF trên Windows và làm sạch cảnh báo format:check.
- [x] `ac-3` (met): Cố định tường minh pool: 'forks' trong vitest.config.ts và bổ sung describe.sequential cho toàn bộ 26 integration test files có gọi process.chdir() để triệt tiêu hoàn toàn race condition khi test chạy song song.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-22 21:49:14 +07:00)
- [x] `check-test-structure` (focused): Kiểm tra cấu trúc và trần dòng của toàn bộ test files — pass (2026-10-22 21:49:31 +07:00)
- [x] `check-gitattributes` (focused): Kiểm tra kiến trúc và cấu hình vitest/gitattributes — pass (2026-10-22 21:44:11 +07:00)
- [x] `check-format` (focused): Kiểm tra định dạng Prettier chuẩn hóa LF trên toàn bộ repo — pass (2026-10-22 21:49:44 +07:00)

## Evidence

- `check-format` — pass (2026-10-22 21:49:44 +07:00): pnpm format:check — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-test-structure` — pass (2026-10-22 21:49:31 +07:00): pnpm vitest run test/unit/test-structure.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-gitattributes` — pass (2026-10-22 21:44:11 +07:00): pnpm vitest run test/workflow/architecture.test.ts — exit 0
- `check-suite` — pass (2026-10-22 21:49:14 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
