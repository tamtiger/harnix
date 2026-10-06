# Output --run-check chỉ nêu test lỗi thay vì đuôi log dài

- **ID:** 20261006-202545-run-check-failure-summary
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** planning/planning
- **Created:** 2026-10-06 20:25:42 +07:00
- **Updated:** 2026-10-06 20:25:42 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Goal

Khi một check fail, outputTail của --run-check hiện tối đa 2000 ký tự log thô; thay bằng tóm tắt các test lỗi (tên và dòng đầu thông điệp) khi nhận diện được định dạng vitest, và giữ đuôi ngắn cho lệnh khác, để giảm token đọc lỗi.

## Non-goals

- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Acceptance criteria

- `ac-1` (pending): Khi check fail và output có báo cáo lỗi vitest nhận diện được, outputTail liệt kê tên test lỗi cùng dòng đầu thông điệp, tối đa 10 mục và 800 ký tự.
- `ac-2` (pending): Với lệnh khác hoặc output không nhận diện được, outputTail rút còn tối đa 600 ký tự cuối; khi pass không có outputTail.
- `ac-3` (pending): outputTail vẫn không được lưu vào task và không lộ đường dẫn tuyệt đối của máy.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
