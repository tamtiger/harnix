# Thống nhất quy tắc --reason và gộp --evidence với --criterion --met

- **ID:** 20261105-145435-consistent-reason-and-combo
- **Mode:** lite
- **Epic:** 20261105-145432-workflow-friction-v2
- **Status:** completed/finishing
- **Created:** 2026-11-05 14:54:32 +07:00
- **Updated:** 2026-11-09 11:54:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Làm quy tắc --reason nhất quán và nêu trong --schema; cho phép ghi evidence và đánh dấu criterion trong một lệnh.

## Relevant paths

- `src/commands/workflow-command.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-handlers.ts`
- `src/core/workflow/actions.ts`
- `src/core/workflow/criterion.ts`
- `src/core/workflow/evidence-flags.ts`
- `src/core/workflow/schema.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +30 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +1 / -1 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `docs/prompts/repo-graph-tools-research.md` | added | - |
| `package.json` | modified | +1 / -1 |
| `src/commands/checks.ts` | modified | +11 / -1 |
| `src/commands/status.ts` | modified | +10 / -1 |
| `src/commands/workflow-command.ts` | modified | +1 / -2 |
| `src/commands/workflow-edit-handlers.ts` | modified | +11 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +6 / -3 |
| `src/commands/workflow-flags.ts` | modified | +9 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +4 / -0 |
| `src/core/tasks/task-state.ts` | modified | +2 / -4 |
| `src/core/tasks/transition-hint.ts` | added | - |
| `src/core/verification/input-digest.ts` | modified | +5 / -2 |
| `src/core/verification/input-hint.ts` | added | - |
| `src/core/workflow/actions.ts` | modified | +1 / -0 |
| `src/core/workflow/baseline-status.ts` | added | - |
| `src/core/workflow/check-config-edit.ts` | added | - |
| `src/core/workflow/check-flag-issues.ts` | added | - |
| `src/core/workflow/evidence-criteria.ts` | added | - |
| `src/core/workflow/evidence-flags.ts` | modified | +12 / -1 |
| `src/core/workflow/flag-issues.ts` | added | - |
| `src/core/workflow/index.ts` | modified | +1 / -0 |
| `src/core/workflow/init-checks-notice.ts` | added | - |
| `src/core/workflow/init-issues.ts` | added | - |
| `src/core/workflow/init-spec.ts` | modified | +20 / -12 |
| `src/core/workflow/init-task.ts` | modified | +32 / -42 |
| `src/core/workflow/obligations.ts` | modified | +5 / -3 |
| `src/core/workflow/plan-edit.ts` | modified | +8 / -12 |
| `src/core/workflow/reason-rules.ts` | added | - |
| `src/core/workflow/remove-check.ts` | added | - |
| `src/core/workflow/schema.ts` | modified | +12 / -2 |
| `src/core/workflow/secret-scan-changes.ts` | added | - |
| `src/core/workflow/secret-scan.ts` | modified | +20 / -7 |
| `src/core/workflow/suite-gate.ts` | modified | +2 / -13 |
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

_(33 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): --set-goal và --set-title chấp nhận --reason (tùy chọn) giống các lệnh sửa obligation khác, và --schema nêu cho từng action là --reason bắt buộc, tùy chọn hay không nhận.
- [x] `ac-2` (met): --evidence --check <id> --result pass ... --criterion <ids> --met chạy trong một lệnh: ghi evidence rồi đánh dấu criterion chỉ từ pass vừa ghi (digest còn mới, không dùng pass cũ), atomic (lỗi thì không ghi gì), và báo lỗi nếu evidence không pass.
- [x] `ac-3` (met): Cờ mới được đăng ký đủ theo checklist thêm cờ workflow (bảng actions, flag-owners, --schema, cli-contract); các test action-checklist và actions.test.ts xanh.
- [x] `ac-4` (met): Tài liệu và snapshot đồng bộ: docs/HARNIX_WORKFLOW.md, src/templates/harnix/workflow.md (chạy pnpm selfhost:sync), mô tả --schema và docs/HARNIX_PRD.md nếu bề mặt công khai đổi; behavior-snapshot.golden.json chỉ cập nhật cho đúng chuỗi mới; phiên bản bump 2.29.0-dev.N kèm CHANGELOG trước verifying.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 11:52:08 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 11:53:35 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 11:52:16 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 11:52:08 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/commands test/workflow/cli-contract.test.ts — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 11:52:16 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-09 11:53:35 +07:00): pnpm test — exit 0
