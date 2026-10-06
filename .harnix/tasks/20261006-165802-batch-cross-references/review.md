# --batch và --set-check chấp nhận tham chiếu chéo trong cùng một lần gọi

- **ID:** 20261006-165802-batch-cross-references
- **Mode:** full
- **Epic:** 20261006-141317-workflow-field-feedback
- **Status:** planning/planning
- **Created:** 2026-10-06 16:58:00 +07:00
- **Updated:** 2026-10-06 16:58:00 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Tiêu chí và check được khai báo trong cùng một lệnh có thể tham chiếu nhau mà không phụ thuộc thứ tự, vì hiện tại --batch báo coverage incomplete hoặc unknown criterion khi tiêu chí trỏ tới check chưa tồn tại.

## Non-goals

- Không nới luật mỗi tiêu chí phải được một check bắt buộc phủ
- Không đổi luật bất biến sau ready

## Acceptance criteria

- `ac-1` (pending): --batch áp dụng toàn bộ criteria và checks rồi mới validate coverage, nên criteria[].checks trỏ tới check định nghĩa trong cùng batch và checks[].criteria trỏ tới tiêu chí định nghĩa trong cùng batch đều hợp lệ.
- `ac-2` (pending): Lỗi khi tham chiếu thực sự không tồn tại nêu rõ id thiếu và mọi vấn đề độc lập trong một lần báo.
- `ac-3` (pending): --set-check nhận --criteria chứa tiêu chí vừa thêm trong cùng một --batch mà không cần hai lệnh theo thứ tự cố định; có test hồi quy cho đúng kịch bản Task digest đã gặp.
- `ac-4` (pending): Tài liệu cookbook ghi rõ batch không phụ thuộc thứ tự.

## Required checks

- `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
