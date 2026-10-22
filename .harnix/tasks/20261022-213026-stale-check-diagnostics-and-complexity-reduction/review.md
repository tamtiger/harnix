# Cải tiến chẩn đoán Stale Check và Hạ Cyclomatic Complexity Toàn diện

- **ID:** 20261022-213026-stale-check-diagnostics-and-complexity-reduction
- **Mode:** lite
- **Epic:** 20261022-213024-workflow-ergonomics-and-codebase-hardening
- **Status:** completed/finishing
- **Created:** 2026-10-22 21:30:26 +07:00
- **Updated:** 2026-10-22 22:07:42 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Nâng cấp chẩn đoán digest-mismatch trong status --explain và kết quả audit/completion để liệt kê chi tiết các file cụ thể bị thay đổi hash; thêm cảnh báo checklist plan.md chưa hoàn tất tại workflow --transition verifying/verifying; refactor hạ Cyclomatic Complexity cho toàn bộ 7 hàm chạm trần 20 và các hàm chạm trần 19 xuống dưới 15.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `.gitattributes` | added | - |
| `.prettierrc.json` | modified | +1 / -2 |
| `CHANGELOG.md` | modified | +8 / -0 |
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

_(486 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Nâng cấp chẩn đoán digest-mismatch trong status --explain và kết quả audit/completion để liệt kê chi tiết các file cụ thể bị thay đổi hash (không còn mảng changes rỗng), giúp dev biết ngay nguyên nhân check bị stale.
- [x] `ac-2` (met): Bổ sung cảnh báo sớm (warning) khi chuyển trạng thái sang verifying/verifying nếu checklist trong plan.md chưa đạt 100% [x] (áp dụng cho task có plan.md).
- [x] `ac-3` (met): Refactor và hạ Cyclomatic Complexity của toàn bộ các hàm chạm trần 20 và sát trần 19 (đặc biệt trong task-store.ts, plan-edit.ts, transition.ts, project-files.ts, repo-map/outline.ts, verify-plan.ts, task-audit.ts, task-index.ts, task-resume.ts, save-files.ts) xuống dưới 15.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-22 22:07:16 +07:00)
- [x] `check-audit-diagnostics` (focused): Kiểm tra chẩn đoán audit và completion khi stale check — pass (2026-10-22 22:04:58 +07:00)
- [x] `check-complexity-lint` (focused): Kiểm tra lint và đảm bảo không có hàm nào vi phạm complexity >= 15 — pass (2026-10-22 22:05:26 +07:00)

## Evidence

- `check-audit-diagnostics` — pass (2026-10-22 22:04:58 +07:00): pnpm vitest run test/unit/core/tasks/task-audit.test.ts test/unit/core/workflow/completion.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-complexity-lint` — pass (2026-10-22 22:05:26 +07:00): pnpm lint — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-10-22 22:07:16 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
