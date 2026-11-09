# Hint transition tính theo trạng thái hiện tại và xác minh resume verifying

- **ID:** 20261105-145437-transition-next-step-hint
- **Mode:** lite
- **Epic:** 20261105-145432-workflow-friction-v2
- **Status:** completed/finishing
- **Created:** 2026-11-05 14:54:32 +07:00
- **Updated:** 2026-11-09 11:02:15 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Thông báo Illegal task transition nêu đúng chuỗi lệnh kế tiếp; tái hiện báo cáo --replace-check ở verifying rơi về replan và sửa nếu còn lỗi.

## Relevant paths

- `src/commands/workflow-command.ts`
- `src/core/tasks/task-state.ts`
- `src/core/workflow/plan-edit.ts`
- `src/core/workflow/replace-check.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `CHANGELOG.md` | modified | +6 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/prompts/repo-graph-tools-research.md` | added | - |
| `package.json` | modified | +1 / -1 |
| `src/commands/workflow-command.ts` | modified | +0 / -2 |
| `src/core/tasks/task-state.ts` | modified | +2 / -4 |
| `src/core/tasks/transition-hint.ts` | added | - |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-plan/references/epic.md` | modified | +4 / -0 |
| `src/skills/harnix-research/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-security-lens/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `test/integration/commands/workflow-command.test.ts` | modified | +12 / -0 |
| `test/unit/core/tasks/transition-hint.test.ts` | added | - |
| `test/workflow/behavior-snapshot.golden.json` | modified | +1 / -1 |
| `test/workflow/check-edits-verifying.test.ts` | added | - |

## Acceptance criteria

- [x] `ac-1` (met): Illegal task transition kèm hint tính từ trạng thái hiện tại: chuỗi lệnh --transition cần chạy để tới đích (ví dụ planning -> in_progress gợi ý ready/ready rồi in_progress/implementing), thay cho câu cố định.
- [x] `ac-2` (met): Bắt đầu bằng test tái hiện: --set-check và --replace-check khi task đang verifying phải kết thúc ở verifying/verifying, không ở replan; có regression test cho cả hai lệnh; nếu test tái hiện đỏ thì sửa, nếu đã xanh thì chỉ giữ test.
- [x] `ac-3` (met): Hint chuỗi lệnh chỉ tính ở task-state.ts; nhánh cố định "Illegal task transition" trong fixedHint của workflow-command.ts bị xóa để hint không nhân đôi hoặc mâu thuẫn.
- [x] `ac-4` (met): Tài liệu và snapshot đồng bộ: docs/HARNIX_WORKFLOW.md, src/templates/harnix/workflow.md (chạy pnpm selfhost:sync), mô tả --schema và docs/HARNIX_PRD.md nếu bề mặt công khai đổi; behavior-snapshot.golden.json chỉ cập nhật cho đúng chuỗi mới; phiên bản bump 2.29.0-dev.N kèm CHANGELOG trước verifying.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 11:00:10 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 11:01:38 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 11:00:18 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 11:00:10 +07:00): pnpm exec vitest run test/unit/core/tasks test/unit/core/workflow test/unit/commands — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 11:00:18 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-09 11:01:38 +07:00): pnpm test — exit 0
