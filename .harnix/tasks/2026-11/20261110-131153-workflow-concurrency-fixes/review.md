# Sửa tranh chấp khóa và mất cập nhật trong workflow

- **ID:** 20261110-131153-workflow-concurrency-fixes
- **Mode:** full
- **Epic:** 20261110-131151-harnix-review-refactor
- **Status:** completed/finishing
- **Created:** 2026-11-10 13:11:51 +07:00
- **Updated:** 2026-11-10 13:44:31 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Làm khóa workflow ổn định giữa các tiến trình, đưa mọi ghi plan.md và epic.json vào vùng được khóa hoặc merge an toàn, và sửa các lỗi trạng thái cục bộ (regex cờ g, now không inject).

## Non-goals

- Không đổi schema TaskRecord v3, enum hay transition
- Không đổi định dạng epic.json

## Relevant paths

- `src/core/epics`
- `src/core/tasks`
- `src/core/workflow`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +12 / -0 |
| `README.md` | modified | +28 / -28 |
| `package.json` | modified | +1 / -1 |
| `src/commands/pause.ts` | modified | +2 / -1 |
| `src/commands/resume.ts` | modified | +7 / -3 |
| `src/core/epics/epic.ts` | modified | +15 / -2 |
| `src/core/tasks/task-resume.ts` | modified | +12 / -6 |
| `src/core/workflow/plan-sync.ts` | modified | +13 / -3 |
| `src/core/workflow/run-checks.ts` | modified | +8 / -1 |
| `src/core/workflow/transition.ts` | modified | +2 / -1 |
| `src/core/workflow/workflow-lock.ts` | modified | +5 / -3 |
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
| `test/integration/commands/pause.test.ts` | modified | +52 / -0 |
| `test/safety/process-timeout.test.ts` | added | - |
| `test/unit/core/epics/epic.test.ts` | modified | +50 / -0 |
| `test/unit/core/tasks/task-resume.test.ts` | modified | +31 / -1 |
| `test/unit/core/workflow/plan-sync.test.ts` | modified | +51 / -1 |
| `test/unit/core/workflow/workflow-lock.test.ts` | modified | +24 / -0 |
| `test/unit/utils/check-runner.test.ts` | modified | +1 / -1 |
| `test/unit/utils/git.test.ts` | modified | +48 / -4 |
| `test/unit/utils/harnix-launcher.test.ts` | modified | +18 / -6 |
| `test/unit/utils/process-group.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): withWorkflowLock đặt khóa theo realpath đã chuẩn hóa của .harnix, không phụ thuộc tmpdir hay cách viết đường dẫn; có test hai cách viết đường dẫn dùng cùng một khóa.
- [x] `ac-2` (met): tickWorkflow và syncPlanChecklistPass đọc rồi ghi plan.md dưới withWorkflowLock (không lồng khóa); có test hồi quy chống mất cập nhật.
- [x] `ac-3` (met): upsertEpic từ envelope giữ order và createdAt của epic đã tồn tại (merge); có test.
- [x] `ac-4` (met): pauseTask và resumeTask chạy dưới khóa workflow; có test.
- [x] `ac-5` (met): TEST_FILE_PATTERN không còn trạng thái lastIndex, regex checklist chưa tick dùng chung một hằng, run-check và run-checks dùng now đã inject; có test.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của member — pass (2026-11-10 13:44:28 +07:00)
- [x] `chk-suite` (full): Toàn bộ suite của dự án — pass (2026-11-10 13:43:21 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-10 13:44:28 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/core/tasks test/unit/core/epics — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-10 13:43:21 +07:00): pnpm test — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
