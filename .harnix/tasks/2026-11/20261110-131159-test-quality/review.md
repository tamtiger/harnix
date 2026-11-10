# Nâng chất lượng bộ test

- **ID:** 20261110-131159-test-quality
- **Mode:** lite
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 14:40:13 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | test-helpers-not-merged: low |

## Goal

Loại test chạy rỗng, assert yếu và phụ thuộc đồng hồ hoặc timer thật, gom helper test dùng chung, giữ coverage floor không giảm.

## Non-goals

- Không hạ coverage floor
- Không đổi hành vi src

## Relevant paths

- `test`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +48 / -0 |
| `README.md` | modified | +28 / -28 |
| `package.json` | modified | +1 / -1 |
| `src/commands/global-uninstall.ts` | modified | +2 / -1 |
| `src/commands/global-update.ts` | modified | +2 / -1 |
| `src/commands/legacy-project-surfaces.ts` | modified | +1 / -4 |
| `src/commands/mem.ts` | modified | +2 / -2 |
| `src/commands/pause.ts` | modified | +2 / -1 |
| `src/commands/repo-map-internal.ts` | modified | +2 / -2 |
| `src/commands/resume.ts` | modified | +7 / -3 |
| `src/commands/setup.ts` | modified | +2 / -1 |
| `src/commands/skills-extension.ts` | deleted | +0 / -38 |
| `src/commands/status.ts` | modified | +4 / -7 |
| `src/commands/update.ts` | modified | +2 / -2 |
| `src/commands/workflow-handler-utils.ts` | modified | +22 / -7 |
| `src/commands/workflow-handlers.ts` | modified | +12 / -3 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +11 / -7 |
| `src/core/config/config-schema.ts` | modified | +0 / -1 |
| `src/core/config/config-validate.ts` | modified | +2 / -1 |
| `src/core/context/context.ts` | modified | +2 / -6 |
| `src/core/context/effective-context.ts` | modified | +2 / -7 |
| `src/core/context/selection-freshness.ts` | modified | +1 / -1 |
| `src/core/doctor/doctor.ts` | modified | +35 / -23 |
| `src/core/doctor/finding-codes-project.ts` | modified | +2 / -0 |
| `src/core/doctor/finding-codes.ts` | modified | +1 / -1 |
| `src/core/doctor/findings.ts` | modified | +0 / -4 |
| `src/core/doctor/global-inspect.ts` | modified | +4 / -3 |
| `src/core/doctor/project-legacy.ts` | modified | +4 / -3 |
| `src/core/doctor/project-tasks.ts` | modified | +27 / -6 |
| `src/core/doctor/project.ts` | modified | +4 / -10 |
| `src/core/epics/epic-location.ts` | modified | +2 / -2 |
| `src/core/epics/epic.ts` | modified | +15 / -2 |
| `src/core/global/discovery.ts` | modified | +8 / -19 |
| `src/core/global/locking.ts` | modified | +5 / -2 |
| `src/core/global/managed-json.ts` | modified | +1 / -4 |
| `src/core/global/manifest.ts` | modified | +2 / -5 |
| `src/core/global/setup.ts` | modified | +6 / -0 |
| `src/core/global/toml-guard.ts` | modified | +5 / -2 |
| `src/core/global/transaction.ts` | modified | +41 / -3 |
| `src/core/global/uninstall.ts` | modified | +7 / -4 |
| `src/core/global/update.ts` | modified | +9 / -10 |
| `src/core/journal/journal.ts` | modified | +5 / -9 |
| `src/core/journal/learned-promote.ts` | modified | +2 / -1 |
| `src/core/journal/learning-quality.ts` | modified | +2 / -2 |
| `src/core/journal/learning-relevance.ts` | modified | +1 / -1 |
| `src/core/journal/learning-review.ts` | modified | +1 / -1 |
| `src/core/journal/learning-safety.ts` | modified | +1 / -1 |
| `src/core/managed/project-files.ts` | modified | +3 / -15 |
| `src/core/platform/user-paths.ts` | modified | +3 / -13 |
| `src/core/repo-map/graph-references.ts` | modified | +2 / -2 |

_(100 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Test symlink của secret-scan và suite-command dùng it.skipIf thay vì return sớm.
- [x] `ac-2` (met): workflow-command.test.ts assert giá trị thật của decision, risk, paths và criterion.
- [x] `ac-3` (met): workflow-lock và bounded-input bỏ phụ thuộc đồng hồ hoặc timer thật; helper temporaryGlobalRoot nằm một nơi trong test/support (useTemporaryGlobalRoots) thay cho bốn bản sao.
- [x] `ac-4` (met): epic.test.ts hết flaky EPERM nhờ rename có retry trong test.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 14:38:18 +07:00)
- [x] `chk-gates` (focused): Contract tests nhanh (CLI, docs, cấu trúc test) — pass (2026-11-10 14:38:27 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 14:40:04 +07:00)

## Residual risks

- **test-helpers-not-merged** (low) — project() lặp ở khoảng 8 file test với thân khác nhau, withCwd chưa có và khoảng 164 chỗ process.chdir còn thủ công; file-lock.test.ts và session-cache.test.ts còn dùng Date.now() với biên 30 đến 60 phút.

## Evidence

- skipped (2026-11-10 14:35:53 +07:00): Task contract revised at persisted replan: Helper withCwd và project() dùng chung cần viết lại nhiều thân test dài hoặc đối chiếu từng bản có thân khác nhau; file-lock và session-cache chỉ dùng đồng hồ thật với biên rộng. Làm dở sẽ thêm mã chết nên ghi residual risk.
- `chk-focus` — pass (2026-11-10 14:38:18 +07:00): pnpm exec vitest run test/unit test/integration — exit 0
- `chk-gates` — pass (2026-11-10 14:38:27 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-10 14:40:04 +07:00): pnpm test — exit 0
