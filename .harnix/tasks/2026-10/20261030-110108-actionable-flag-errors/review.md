# Thông báo lỗi flag có ví dụ chạy được và notice plan.md

- **ID:** 20261030-110108-actionable-flag-errors
- **Mode:** lite
- **Epic:** 20261030-110106-workflow-ergonomics
- **Status:** completed/finishing
- **Created:** 2026-10-30 11:01:06 +07:00
- **Updated:** 2026-10-30 13:47:10 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 5/5 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Mọi lỗi về --reason, field lạ trong batch và --slug đều in lệnh sửa chạy được; thêm criterion tự đồng bộ dòng trong plan.md; slug tiếng Việt được bỏ dấu tự động.

## Non-goals

- Không đổi quy tắc bắt buộc --reason sau planning.

## Relevant paths

- `src/core/workflow/batch-validate.ts`
- `src/core/workflow/epic-members.ts`
- `src/core/workflow/init-task.ts`
- `src/core/workflow/obligations.ts`
- `src/core/workflow/plan-edit.ts`
- `src/core/workflow/ready-artifacts.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +24 / -0 |
| `README.md` | modified | +28 / -28 |
| `docs/HARNIX_PRD.md` | modified | +3 / -3 |
| `docs/HARNIX_WORKFLOW.md` | modified | +6 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +2 / -2 |
| `package.json` | modified | +1 / -1 |
| `src/cli-helpers.ts` | modified | +6 / -0 |
| `src/cli-tasks-command.ts` | added | - |
| `src/cli-workflow-commands.ts` | modified | +3 / -23 |
| `src/commands/workflow-command.ts` | modified | +18 / -17 |
| `src/commands/workflow-error-hints.ts` | added | - |
| `src/commands/workflow-flag-owners.ts` | modified | +2 / -2 |
| `src/core/tasks/read-tracker.ts` | modified | +3 / -2 |
| `src/core/tasks/task-index.ts` | modified | +40 / -5 |
| `src/core/workflow/batch-validate.ts` | modified | +4 / -1 |
| `src/core/workflow/cancel.ts` | modified | +19 / -1 |
| `src/core/workflow/epic-members.ts` | modified | +1 / -1 |
| `src/core/workflow/init-task.ts` | modified | +7 / -2 |
| `src/core/workflow/plan-criterion-notice.ts` | added | - |
| `src/core/workflow/plan-edit.ts` | modified | +4 / -1 |
| `src/core/workflow/ready-artifacts.ts` | modified | +4 / -1 |
| `src/core/workflow/schema.ts` | modified | +3 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +6 / -1 |
| `src/core/workflow/set-criterion.ts` | modified | +2 / -0 |
| `src/core/workflow/similar-tasks.ts` | added | - |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-plan/references/epic.md` | modified | +1 / -1 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/utils/file-lock.ts` | modified | +4 / -8 |
| `test/integration/commands/workflow-handlers.test.ts` | modified | +39 / -0 |
| `test/unit/cli-helpers.test.ts` | modified | +7 / -0 |
| `test/unit/cli-tasks-command.test.ts` | added | - |
| `test/unit/commands/workflow-error-hints.test.ts` | added | - |
| `test/unit/commands/workflow-flag-owners.test.ts` | modified | +1 / -1 |
| `test/unit/core/tasks/read-tracker.test.ts` | modified | +4 / -2 |
| `test/unit/core/tasks/task-index.test.ts` | modified | +49 / -0 |
| `test/unit/core/workflow/batch-validate.test.ts` | modified | +3 / -1 |
| `test/unit/core/workflow/cancel.test.ts` | modified | +47 / -0 |
| `test/unit/core/workflow/epic-members.test.ts` | modified | +1 / -1 |

_(9 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Lỗi thiếu hoặc sai độ dài --reason có hint chứa lệnh mẫu dạng --reason "<10-1000 ký tự>" với đúng flag đang chạy.
- [x] `ac-2` (met): Lỗi Unknown field trong batch liệt kê các field hợp lệ của envelope.
- [x] `ac-3` (met): Không ghi vào plan.md (file thuộc người dùng): khi --add-criterion hoặc --set-criterion chạy trên task Full mà plan.md chưa nhắc criterion id, lệnh in notice trên stderr nêu id cần thêm; thông báo "plan.md never mentions criterion" của ready gate nêu cách sửa (thêm id vào một mục checklist của plan.md).
- [x] `ac-5` (met): Lỗi Epic member task already exists and differs nêu hint dùng --task <id> với --set-check, --set-criterion hoặc --set-goal để sửa member thay vì --save.
- [x] `ac-6` (met): Lỗi --init do title có dấu mà thiếu --slug kèm ví dụ chạy được dạng --slug task-sprawl-guard; quy ước ID tiếng Anh không đổi.

## Required checks

- [x] `chk-errors` (focused): Test tập trung cho hint lỗi, notice plan.md và hint slug — pass (2026-10-30 13:45:27 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-10-30 13:47:02 +07:00)

## Evidence

- `chk-errors` — pass (2026-10-30 13:45:27 +07:00): pnpm exec vitest run test/workflow test/unit/commands test/unit/core/workflow test/integration/commands — exit 0
- `chk-suite` — pass (2026-10-30 13:47:02 +07:00): pnpm test — exit 0
