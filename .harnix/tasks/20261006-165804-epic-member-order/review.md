# Thứ tự thực thi member của epic không phụ thuộc ID

- **ID:** 20261006-165804-epic-member-order
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** planning/planning
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 16:58:00 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Epic có thể khai báo thứ tự chạy rõ ràng để harnix epic gợi ý đúng task kế tiếp khi người dùng đổi ưu tiên, thay vì luôn theo ID tăng dần.

## Non-goals

- Không đổi ID của task đã tạo
- Không đổi hành vi của epic cũ không khai báo thứ tự

## Acceptance criteria

- `ac-1` (pending): EpicRecord có field tùy chọn order (danh sách task ID) được validate: chỉ chứa id thuộc epic, không trùng; epic cũ không có field vẫn đọc bình thường.
- `ac-2` (pending): harnix epic <id> chọn nextTask theo order trước, phần còn lại theo ID tăng dần, và file epic .md hiển thị đúng thứ tự đó.
- `ac-3` (pending): Một lệnh hợp lệ (ví dụ harnix workflow --epic-order <epic-id> <task-ids>) cập nhật order mà không sửa task.json của task nào; có test.
- `ac-4` (pending): Tài liệu hợp đồng đóng băng và epic reference mô tả order và quy tắc chọn task kế tiếp.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
