# Xóa dead code và tách file sát trần

- **ID:** 20261110-131158-dead-code-and-size
- **Mode:** full
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 14:33:28 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 3/3 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 2 | terminal-finalize-duplication: low, select-action-kept: low |

## Goal

Xóa mã chết đã xác nhận, thu hẹp bề mặt export và tách các file sát trần 300 dòng code để dễ bảo trì, giữ nguyên hành vi.

## Non-goals

- Không refactor registry platform
- Không đổi hành vi công khai

## Relevant paths

- `src/commands`
- `src/core/stack`
- `src/core/tasks`
- `src/core/verification`
- `src/core/workflow`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +42 / -0 |
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

_(90 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Xóa dead code đã xác nhận (skills-extension.ts, selectAction, verify-docs-sync.ts, packageVerifyKeys, dòng thừa trong completion.ts, export không dùng) cùng test liên quan.
- [x] `ac-2` (met): plan-edit.ts dùng một khung chung (editReviewData) cho các setter review-data setPaths, addDecision, addRisk, setTitle, setGoal, giữ nguyên thứ tự lỗi; test đặc trưng hiện có xanh.
- [x] `ac-3` (met): behavior-snapshot.golden.json không đổi và không mở rộng danh sách miễn trừ ESLint hay architecture.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 14:31:06 +07:00)
- [x] `chk-gates` (focused): Contract tests nhanh (CLI, docs, cấu trúc test) — pass (2026-11-10 14:31:16 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 14:32:57 +07:00)

## Residual risks

- **terminal-finalize-duplication** (low) — finish.ts và cancel.ts còn lặp phần lưu bản ghi terminal, journal và archive; archive.ts và plan-edit.ts sát trần 300 dòng thô nhưng vẫn qua lint theo dòng code. Chưa gom vì đường terminal có recover phức tạp.
- **select-action-kept** (low) — selectAction chỉ còn test dùng nhưng nhiều test phụ thuộc vào ngữ nghĩa ném lỗi của nó; giữ lại, cân nhắc chuyển sang selectActions ở đợt khác.

## Evidence

- `chk-focus` — pass (2026-11-10 14:31:06 +07:00): pnpm exec vitest run test/workflow/behavior-snapshot.test.ts test/workflow/architecture.test.ts — exit 0
- `chk-gates` — pass (2026-11-10 14:31:16 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-10 14:32:57 +07:00): pnpm test — exit 0
