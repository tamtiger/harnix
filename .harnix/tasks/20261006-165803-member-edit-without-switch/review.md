# Sửa kế hoạch của task thành viên epic mà không phải pause và resume

- **ID:** 20261006-165803-member-edit-without-switch
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** planning/planning
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 16:58:00 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Cho phép các lệnh sửa obligation, đường dẫn và ghi chú nhắm tới một task thành viên đang planning của epic bằng --task <id>, thay vì chuỗi pause, resume, sửa, pause, resume dễ làm mất con trỏ.

## Non-goals

- Không cho sửa task terminal hoặc task đã qua planning ngoài luật guarded replan hiện có
- Không cho --task ở hành động chuyển trạng thái hay finish

## Acceptance criteria

- `ac-1` (pending): Các lệnh --set-check, --add-criterion, --set-paths, --add-decision, --add-risk và --batch nhận --task <task-id> nhắm tới task chưa terminal của cùng project mà không đổi con trỏ active.
- `ac-2` (pending): --task bị từ chối với --transition, --finish, --cancel, --run-check và --evidence, và với task đã completed hoặc cancelled, kèm lỗi nêu lý do.
- `ac-3` (pending): Mọi luật hiện có (reason sau planning, bất bất biến, lock workflow) áp dụng y hệt cho task đích; có test chứng minh không đổi .active và không ghi nhầm vào task đang active.
- `ac-4` (pending): Tài liệu epic reference bỏ hướng dẫn pause và resume để sửa member, thay bằng --task.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
