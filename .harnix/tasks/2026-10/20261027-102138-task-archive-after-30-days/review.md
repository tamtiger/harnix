# Lệnh harnix archive chuyển task và epic đã kết thúc quá 30 ngày vào kho lưu trữ

- **ID:** 20261027-102138-task-archive-after-30-days
- **Mode:** full
- **Epic:** 20261027-102134-task-layout-bucket-archive
- **Status:** completed/finishing
- **Created:** 2026-10-27 10:21:38 +07:00
- **Updated:** 2026-10-27 14:39:36 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 4/4 passed |
| Residual risks | 1 | archive-restore-rearchive: low |

## Goal

Thêm lệnh công khai harnix archive (mặc định dry-run, --apply mới ghi, --days mặc định 30, --restore <id>) chuyển task completed hoặc cancelled và epic đã hoàn tất quá hạn vào _archive bằng rename; epic hoàn tất được lưu trữ cùng toàn bộ thành viên; kho chỉ đọc; đóng epic bằng bản phát hành minor 2.23.0.

## Non-goals

- Không tự động archive trong init, update hay finish
- Không xóa task và không sửa nội dung task

## Relevant paths

- `src/commands/archive.ts`
- `src/core/tasks/**`
- `src/cli-workflow-commands.ts`
- `docs/**`
- `README.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `test/integration/commands/archive.test.ts`

## Relevant specs

- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `docs/IMPLEMENTATION_PLAN.md`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +1 / -0 |
| `CHANGELOG.md` | modified | +9 / -0 |
| `README.md` | modified | +6 / -4 |
| `docs/HARNIX_PRD.md` | modified | +12 / -6 |
| `docs/HARNIX_WORKFLOW.md` | modified | +2 / -0 |
| `docs/IMPLEMENTATION_PLAN.md` | modified | +1 / -1 |
| `package.json` | modified | +1 / -1 |
| `scripts/rename-retry.mjs` | added | - |
| `scripts/version-sync.mjs` | modified | +3 / -2 |
| `src/cli-archive-command.ts` | added | - |
| `src/cli-program.ts` | modified | +2 / -0 |
| `src/cli-workflow-commands.ts` | modified | +6 / -3 |
| `src/commands/archive.ts` | added | - |
| `src/commands/doctor.ts` | modified | +7 / -1 |
| `src/commands/epic.ts` | modified | +19 / -12 |
| `src/commands/resume.ts` | modified | +3 / -2 |
| `src/commands/update.ts` | modified | +7 / -0 |
| `src/core/context/effective-context.ts` | modified | +2 / -1 |
| `src/core/doctor/layout-finding.ts` | added | - |
| `src/core/doctor/project-tasks.ts` | modified | +9 / -11 |
| `src/core/doctor/project.ts` | modified | +2 / -0 |
| `src/core/doctor/restore-artifacts.ts` | modified | +8 / -7 |
| `src/core/epics/epic-location.ts` | added | - |
| `src/core/epics/epic.ts` | modified | +13 / -86 |
| `src/core/epics/members.ts` | added | - |
| `src/core/epics/migrate.ts` | modified | +5 / -4 |
| `src/core/journal/learning-sources.ts` | modified | +2 / -2 |
| `src/core/tasks/archive.ts` | added | - |
| `src/core/tasks/layout-migration.ts` | added | - |
| `src/core/tasks/task-audit.ts` | modified | +2 / -2 |
| `src/core/tasks/task-index.ts` | modified | +23 / -23 |
| `src/core/tasks/task-location.ts` | added | - |
| `src/core/tasks/task-migration.ts` | modified | +3 / -2 |
| `src/core/tasks/task-resume.ts` | modified | +2 / -1 |
| `src/core/tasks/task-store.ts` | modified | +7 / -4 |
| `src/core/verification/input-digest.ts` | modified | +4 / -5 |
| `src/core/workflow/baseline-hint.ts` | modified | +6 / -8 |
| `src/core/workflow/context.ts` | modified | +2 / -1 |
| `src/core/workflow/epic-members.ts` | modified | +3 / -4 |
| `src/core/workflow/init-lineage.ts` | modified | +13 / -3 |
| `src/core/workflow/learn.ts` | modified | +3 / -2 |
| `src/core/workflow/obligations.ts` | modified | +3 / -2 |
| `src/core/workflow/plan-sync.ts` | modified | +3 / -2 |
| `src/core/workflow/ready-artifacts.ts` | modified | +2 / -1 |
| `src/core/workflow/save-files.ts` | modified | +8 / -4 |
| `src/core/workflow/save.ts` | modified | +4 / -3 |
| `src/core/workflow/target-task.ts` | modified | +2 / -2 |
| `src/core/workflow/transition.ts` | modified | +3 / -2 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |

_(73 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): harnix archive mặc định chỉ liệt kê (dry-run) task completed hoặc cancelled và epic có mọi thành viên kết thúc, mốc kết thúc (completedAt hoặc cancelledAt, thiếu thì updatedAt) quá --days ngày (mặc định 30); --apply chuyển task sang .harnix/tasks/_archive/<YYYY-MM>/<id> và epic cùng toàn bộ thành viên sang _archive tương ứng bằng rename, rồi báo danh sách đã chuyển.
- [x] `ac-2` (met): Không bao giờ archive task đang active, task chưa kết thúc, thành viên của epic chưa hoàn tất (thành viên của epic hoàn tất chỉ được archive cùng epic), task cha của follow-up chưa kết thúc hoặc task không đọc được; kết quả đếm theo lý do bỏ qua và liệt kê id cho mọi lý do trừ mục chỉ chưa đủ ngày; việc archive epic bị gián đoạn giữa chừng được hoàn tất ở lần chạy sau.
- [x] `ac-3` (met): harnix archive --restore <id> đưa task (hoặc epic cùng thành viên) về bucket tháng; mọi thao tác ghi workflow vào task hoặc epic trong _archive bị từ chối với hint trỏ tới --restore, còn mem, learning, epic và --follow-up vẫn đọc được.
- [x] `ac-4` (met): Tài liệu, skill, template và CHANGELOG đồng bộ cho bố cục bucket và lệnh archive; pnpm selfhost:sync chạy; phiên bản đóng epic là 2.23.0 gộp các mục dev bằng pnpm version:sync --fold-dev; measure:footprint và pnpm release:check xanh.

## Required checks

- [x] `chk-archive` (focused): Test lệnh archive và quy tắc đủ điều kiện — pass (2026-10-27 14:34:14 +07:00)
- [x] `chk-gates` (focused): Contract tests (CLI, docs, golden, kiến trúc) — pass (2026-10-27 14:34:20 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án — pass (2026-10-27 14:35:54 +07:00)
- [x] `chk-release` (full): Chuỗi nghiệm thu release — pass (2026-10-27 14:39:23 +07:00)

## Decisions

- **archive-policy** — Archive chỉ chọn task completed hoặc cancelled quá hạn, mốc là completedAt hoặc cancelledAt (thiếu thì updatedAt); không tự động; --restore chạy ngay và task đã restore sẽ bị archive lại ở lần sau nếu vẫn quá hạn.
  - _Why:_ Theo quyết định của người dùng: không tự động; task bỏ quên phải --cancel trước.

## Residual risks

- **archive-restore-rearchive** (low) — Task đã restore vẫn completed hoặc cancelled và quá hạn nên lần harnix archive --apply kế tiếp sẽ chuyển nó lại; muốn giữ lâu hơn phải đổi trạng thái hoặc dùng --days lớn hơn.

## Evidence

- `chk-archive` — pass (2026-10-27 14:34:14 +07:00): pnpm exec vitest run test/integration/commands/archive.test.ts test/unit/core/tasks test/unit/core/epics — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-gates` — pass (2026-10-27 14:34:20 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-27 14:35:54 +07:00): pnpm test — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-release` — pass (2026-10-27 14:39:23 +07:00): pnpm release:check — exit 0
