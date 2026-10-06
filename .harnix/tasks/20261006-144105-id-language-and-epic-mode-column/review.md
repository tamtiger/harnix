# Chuẩn hóa ngôn ngữ ID/title và thêm cột mode vào danh sách member của epic

- **ID:** 20261006-144105-id-language-and-epic-mode-column
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-10-06 14:41:30 +07:00
- **Updated:** 2026-10-06 14:41:30 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Task ID và Epic ID luôn là slug tiếng Anh, còn title, goal và nội dung hướng người dùng là tiếng Việt có dấu; --init không còn sinh slug tiếng Việt từ title, và epic hiển thị mode (lite/full) của từng member.

## Non-goals

- Không đổi tên hay sửa task, epic đã tạo
- Không cố đoán ngôn ngữ của slug bằng từ điển

## Acceptance criteria

- `ac-1` (pending): harnix workflow --init với title có ký tự tiếng Việt (có dấu) mà thiếu --slug báo lỗi nêu rõ phải truyền --slug <english-kebab-case>; --slug hợp lệ tạo ID đúng regex của task, còn title ASCII vẫn tự sinh slug như cũ.
- `ac-2` (pending): harnix epic <epic-id> trả về mode của từng member, và file epic .md có cột Mode trong bảng Members; epic hiện có vẫn hiển thị bình thường.
- `ac-3` (pending): AGENTS.md, workflow.md và skill harnix-plan (kể cả reference epic) ghi quy ước: ID của task và epic là tiếng Anh, title, goal, tiêu chí là tiếng Việt có dấu.
- `ac-4` (pending): Epic hiện tại 20261006-141317-workflow-field-feedback được xem xét lại và bản ghi epic cập nhật những gì còn thiếu (mục tiêu, non-goals) qua đường lệnh hợp lệ.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
