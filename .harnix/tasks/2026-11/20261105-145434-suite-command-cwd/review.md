# Suite check chấp nhận dotnet test <sln> và gợi ý --cwd; cảnh báo sớm ở status

- **ID:** 20261105-145434-suite-command-cwd
- **Mode:** lite
- **Epic:** 20261105-145432-workflow-friction-v2
- **Status:** completed/finishing
- **Created:** 2026-11-05 14:54:32 +07:00
- **Updated:** 2026-11-09 12:11:18 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 7/7 met or waived |
| Required checks | 100% | 3/3 passed |

## Goal

Giải mâu thuẫn whitelist lệnh suite với cwd của run-check trong monorepo .NET nhiều solution, và báo thiếu suite check ngay từ status thay vì đợi finish. Tham chiếu payment-hub: frt-payment-gateway có sln nhưng test nằm ở test/ nên verify-plan báo hasTests=false và chỉ lộ lệnh dotnet test trần của dự án con.

## Relevant paths

- `src/commands/status.ts`
- `src/core/stack/dotnet-projects.ts`
- `src/core/stack/verify-plan.ts`
- `src/core/workflow/command-match.ts`
- `src/core/workflow/ready.ts`
- `src/core/workflow/suite-gate.ts`
- `src/core/workflow/transition.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +2 / -2 |
| `CHANGELOG.md` | modified | +14 / -0 |
| `README.md` | modified | +1 / -1 |
| `docs/HARNIX_PRD.md` | modified | +2 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -2 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `docs/prompts/repo-graph-tools-research.md` | added | - |
| `package.json` | modified | +1 / -1 |
| `src/commands/checks.ts` | modified | +11 / -1 |
| `src/commands/status.ts` | modified | +20 / -2 |
| `src/commands/workflow-command.ts` | modified | +1 / -2 |
| `src/commands/workflow-edit-handlers.ts` | modified | +11 / -1 |
| `src/commands/workflow-flag-owners.ts` | modified | +6 / -3 |
| `src/commands/workflow-flags.ts` | modified | +9 / -0 |
| `src/commands/workflow-handlers.ts` | modified | +4 / -0 |
| `src/core/stack/dotnet-projects.ts` | modified | +33 / -8 |
| `src/core/status.ts` | modified | +3 / -1 |
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
| `src/core/workflow/ready.ts` | modified | +1 / -1 |
| `src/core/workflow/reason-rules.ts` | added | - |
| `src/core/workflow/remove-check.ts` | added | - |
| `src/core/workflow/schema.ts` | modified | +12 / -2 |
| `src/core/workflow/secret-scan-changes.ts` | added | - |
| `src/core/workflow/secret-scan.ts` | modified | +20 / -7 |
| `src/core/workflow/suite-command.ts` | added | - |
| `src/core/workflow/suite-gate.ts` | modified | +67 / -26 |
| `src/core/workflow/transition.ts` | modified | +8 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |

_(43 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): Whitelist suite check chấp nhận dotnet test <đường dẫn .sln tương đối từ repo root> khi .sln tồn tại, và chấp nhận lệnh dotnet test trần khi check khai --cwd trùng thư mục của solution hoặc dự án test.
- [x] `ac-2` (met): Thông báo lỗi suite command nêu cả hai cách (đường dẫn .sln hoặc --cwd) và liệt kê cwd khả dĩ lấy từ verify-plan --recursive.
- [x] `ac-3` (met): verify-plan nhận ra solution có dự án test nằm trong thư mục con (như frt-payment-gateway/test/*) là hasTests=true với lệnh dotnet test <sln>.
- [x] `ac-4` (met): harnix status và workflow --transition --dry-run cảnh báo sớm khi task chưa có required suite check hợp lệ (lệnh sai hoặc chưa pass), để không phải đợi đến --finish.
- [x] `ac-5` (met): Đường dẫn .sln trong lệnh suite được validate: chỉ tương đối từ repo root, chuẩn hóa POSIX, tồn tại, nằm trong repo; từ chối "..", đường dẫn tuyệt đối, symlink hoặc junction thoát ra ngoài và ký tự shell; có test cho từng trường hợp bị từ chối.
- [x] `ac-6` (met): Logic nhận diện test project trong thư mục con đặt ở dotnet-projects.ts hoặc module mới để verify-plan.ts không vượt 300 dòng code; lint và test kiến trúc vẫn xanh.
- [x] `ac-7` (met): Tài liệu và snapshot đồng bộ: docs/HARNIX_WORKFLOW.md, src/templates/harnix/workflow.md (chạy pnpm selfhost:sync), mô tả --schema và docs/HARNIX_PRD.md nếu bề mặt công khai đổi; behavior-snapshot.golden.json chỉ cập nhật cho đúng chuỗi mới; phiên bản bump 2.29.0-dev.N kèm CHANGELOG trước verifying.

## Required checks

- [x] `chk-focus` (focused): Test tập trung của thay đổi — pass (2026-11-09 12:06:09 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-09 12:07:40 +07:00)
- [x] `chk-gates` (focused): Contract test: cli-contract, architecture, docs, golden, instruction budget — pass (2026-11-09 12:06:17 +07:00)

## Evidence

- `chk-focus` — pass (2026-11-09 12:06:09 +07:00): pnpm exec vitest run test/unit/core/workflow/suite-gate.test.ts test/unit/core/stack — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-gates` — pass (2026-11-09 12:06:17 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-11-09 12:07:40 +07:00): pnpm test — exit 0
