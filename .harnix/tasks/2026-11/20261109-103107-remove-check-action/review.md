# Vòng đời check: thêm --remove-check và sửa cwd check chưa pass không replan

- **ID:** 20261109-103107-remove-check-action
- **Mode:** lite
- **Epic:** 20261105-145432-workflow-friction-v2
- **Status:** completed/finishing
- **Created:** 2026-11-09 10:31:07 +07:00
- **Updated:** 2026-11-09 11:42:55 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 6/6 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Dọn check thừa bằng --remove-check (chưa có evidence) và cho đổi cwd của check chưa pass trực tiếp bằng --set-check mà không nhảy về replan.

## Relevant paths

- `src/commands/workflow-command.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-handlers.ts`
- `src/core/workflow/actions.ts`
- `src/core/workflow/index.ts`
- `src/core/workflow/obligations.ts`
- `src/core/workflow/plan-edit.ts`
- `src/core/workflow/plan-remove.ts`
- `src/core/workflow/retry-guard.ts`
- `src/core/workflow/schema.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -1 |
| `CHANGELOG.md` | modified | +24 / -0 |
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
| `src/commands/workflow-flag-owners.ts` | modified | +12 / -2 |
| `src/commands/workflow-flags.ts` | modified | +2 / -0 |
| `src/core/tasks/task-state.ts` | modified | +2 / -4 |
| `src/core/tasks/transition-hint.ts` | added | - |
| `src/core/verification/input-digest.ts` | modified | +5 / -2 |
| `src/core/verification/input-hint.ts` | added | - |
| `src/core/workflow/actions.ts` | modified | +1 / -0 |
| `src/core/workflow/baseline-status.ts` | added | - |
| `src/core/workflow/check-config-edit.ts` | added | - |
| `src/core/workflow/check-flag-issues.ts` | added | - |
| `src/core/workflow/flag-issues.ts` | added | - |
| `src/core/workflow/index.ts` | modified | +1 / -0 |
| `src/core/workflow/init-checks-notice.ts` | added | - |
| `src/core/workflow/init-issues.ts` | added | - |
| `src/core/workflow/init-spec.ts` | modified | +20 / -12 |
| `src/core/workflow/init-task.ts` | modified | +32 / -42 |
| `src/core/workflow/obligations.ts` | modified | +5 / -3 |
| `src/core/workflow/plan-edit.ts` | modified | +8 / -12 |
| `src/core/workflow/remove-check.ts` | added | - |
| `src/core/workflow/schema.ts` | modified | +3 / -1 |
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
| `src/skills/harnix-sequential-thinking/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verification-gap/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-verify/references/cookbook-commands.md` | modified | +1 / -1 |

_(24 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): harnix workflow --remove-check <id> xóa một check chưa có evidence nào; bị từ chối kèm hint (replace-check) nếu check đã có evidence hoặc nếu việc xóa làm một criterion không còn required check phủ.
- [x] `ac-2` (met): Cờ được đăng ký đủ theo checklist thêm action workflow (bảng actions, flag-owners, handler, --schema, brief, cli-contract) và --task áp dụng được như các lệnh remove khác.
- [x] `ac-3` (met): Tài liệu và snapshot đồng bộ: docs/HARNIX_WORKFLOW.md, src/templates/harnix/workflow.md (chạy pnpm selfhost:sync), mô tả --schema và docs/HARNIX_PRD.md nếu bề mặt công khai đổi; behavior-snapshot.golden.json chỉ cập nhật cho đúng chuỗi mới; phiên bản bump 2.29.0-dev.N kèm CHANGELOG trước verifying.
- [x] `ac-4` (met): --set-check <id> --cwd <path> cho check không có evidence pass và chỉ đổi cwd (hoặc description) được áp dụng trực tiếp, không cần --replace-check, không đưa task về replan; đổi command, inputs hoặc criteria vẫn theo quy tắc cũ.
- [x] `ac-5` (met): Đổi cwd như vậy tính là lần thử mới của circuit breaker (không cần --reset-breaker), check đã pass vẫn bất biến, và lỗi từ chối còn lại nêu rõ khi nào cwd-only được phép.
- [x] `ac-6` (met): Logic cwd-only đặt trong module riêng hoặc obligations.ts sao cho plan-edit.ts và obligations.ts không vượt 300 dòng code; lint max-lines và test kiến trúc vẫn xanh.

## Required checks

- [x] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-11-09 11:42:25 +07:00)
- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 11:40:58 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 11:41:06 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 11:40:58 +07:00): pnpm exec vitest run test/unit/core/workflow test/unit/commands test/workflow/cli-contract.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 11:41:06 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-09 11:42:25 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
