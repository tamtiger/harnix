# Gom helper trùng lặp trong utils và core

- **ID:** 20261110-131157-dedupe-utils-refactor
- **Mode:** full
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 14:22:02 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Thay các bản sao isMissing, isContainedPath, renameWithRetry, readBoundedText, readOptionalText và compareCodeUnits bằng một bản dùng chung, đúng như refactor thuần không đổi hành vi.

## Non-goals

- Không đổi hành vi công khai
- Không regenerate golden để refactor pass

## Relevant paths

- `src/core`
- `src/utils`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +36 / -0 |
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
| `src/commands/status.ts` | modified | +4 / -7 |
| `src/commands/update.ts` | modified | +2 / -2 |
| `src/commands/workflow-handler-utils.ts` | modified | +22 / -7 |
| `src/commands/workflow-handlers.ts` | modified | +12 / -3 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +11 / -7 |
| `src/core/config/config-validate.ts` | modified | +2 / -1 |
| `src/core/context/context.ts` | modified | +2 / -6 |
| `src/core/context/effective-context.ts` | modified | +2 / -7 |
| `src/core/doctor/doctor.ts` | modified | +35 / -23 |
| `src/core/doctor/finding-codes-project.ts` | modified | +2 / -0 |
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
| `src/core/journal/journal.ts` | modified | +4 / -8 |
| `src/core/journal/learned-promote.ts` | modified | +2 / -1 |
| `src/core/managed/project-files.ts` | modified | +3 / -15 |
| `src/core/platform/user-paths.ts` | modified | +3 / -13 |
| `src/core/repo-map/outline.ts` | modified | +2 / -1 |
| `src/core/repo-map/service.ts` | modified | +6 / -9 |
| `src/core/repo-map/workspace-root-cache.ts` | modified | +2 / -1 |
| `src/core/repo-map/workspace.ts` | modified | +2 / -1 |
| `src/core/spec/project-facts.ts` | modified | +2 / -1 |
| `src/core/spec/project-skills.ts` | modified | +3 / -8 |
| `src/core/stack/detection-engine.ts` | modified | +2 / -11 |
| `src/core/stack/detection.ts` | modified | +4 / -12 |
| `src/core/stack/dotnet-projects.ts` | modified | +6 / -12 |

_(71 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): isMissing và isEnoent gom về một helper trong src/utils và thay mọi bản lặp, không đổi hành vi.
- [x] `ac-2` (met): isContainedPath, renameWithRetry, readBoundedText, readOptionalText và compareCodeUnits mỗi cái chỉ còn một bản.
- [x] `ac-3` (met): behavior-snapshot.golden.json không đổi, architecture test không thêm miễn trừ, suite và test:gates xanh.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 14:20:05 +07:00)
- [x] `chk-gates` (focused): Contract tests nhanh (CLI, docs, cấu trúc test) — pass (2026-11-10 14:20:14 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 14:21:53 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-10 14:20:05 +07:00): pnpm exec vitest run test/workflow/behavior-snapshot.test.ts test/workflow/architecture.test.ts — exit 0
- `chk-gates` — pass (2026-11-10 14:20:14 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-10 14:21:53 +07:00): pnpm test — exit 0
