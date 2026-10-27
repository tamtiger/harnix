# Sửa kế hoạch của task thành viên epic mà không phải pause và resume

- **ID:** 20261006-165803-member-edit-without-switch
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** completed/finishing
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 19:57:47 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Cho phép các lệnh sửa obligation, đường dẫn và ghi chú nhắm tới một task thành viên đang planning của epic bằng --task <id>, thay vì chuỗi pause, resume, sửa, pause, resume dễ làm mất con trỏ.

## Non-goals

- Không cho sửa task terminal hoặc task đã qua planning ngoài luật guarded replan hiện có
- Không cho --task ở hành động chuyển trạng thái hay finish

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Các lệnh --set-check, --add-criterion, --set-paths, --add-decision, --add-risk và --batch nhận --task <task-id> nhắm tới task chưa terminal của cùng project mà không đổi con trỏ active.
- `ac-2` (met): --task bị từ chối với --transition, --finish, --cancel, --run-check và --evidence, và với task đã completed hoặc cancelled, kèm lỗi nêu lý do.
- `ac-3` (met): Mọi luật hiện có (reason sau planning, bất bất biến, lock workflow) áp dụng y hệt cho task đích; có test chứng minh không đổi .active và không ghi nhầm vào task đang active.
- `ac-4` (met): Tài liệu epic reference bỏ hướng dẫn pause và resume để sửa member, thay bằng --task.

## Required checks

- `check-docs` (focused): Tài liệu bỏ chuỗi pause/resume để sửa member — pass (2026-10-06 19:53:56 +07:00)
- `check-suite-2` (full): Toàn bộ test của dự án (thay check-suite) — pass (2026-10-06 19:57:37 +07:00)
- `check-target` (focused): --task nhắm task đích cho các lệnh sửa — pass (2026-10-06 19:54:08 +07:00)

## Residual risks

- **run-check-breaker-after-stale-test** (low) — Chạy lại check-suite sau một lần đỏ do test lỗi thời làm kích hoạt circuit breaker; phải sửa test trước khi chạy lại, nếu không cần --replace-check.

## Evidence

- `check-docs` — pass (2026-10-06 19:53:56 +07:00): pnpm exec vitest run test/workflow/docs-task-contract.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-target` — pass (2026-10-06 19:54:08 +07:00): pnpm exec vitest run test/unit/core/workflow/target-task.test.ts test/integration/commands/workflow-flags.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — fail (2026-10-06 19:55:40 +07:00): pnpm test — exit 1 _(1 earlier rerun not shown; see task.json for full history)_
- skipped (2026-10-06 19:56:05 +07:00): Task contract revised at persisted replan: Suite đỏ hai lần do test danh sách export đã lỗi thời, đã sửa test; thay check với inputs có package.json để chạy lại
- `check-suite-2` — pass (2026-10-06 19:57:37 +07:00): pnpm test — exit 0
