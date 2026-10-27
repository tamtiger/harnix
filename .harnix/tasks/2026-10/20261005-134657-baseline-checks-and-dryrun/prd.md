# PRD - Task 3: Cơ chế Baseline Checks trước Freeze Contract và Transition Dry-run

## 1. Mục tiêu (Goal)
Cung cấp khả năng kiểm tra trước (dry-run) và chạy baseline toàn bộ các required checks trước khi đóng băng (freeze) contract tại trạng thái `ready/ready`. Giúp lập trình viên và agent phát hiện sớm các lỗi cấu hình (input globs rỗng, thiếu checklist, test suite gate) và phân loại lỗi pre-existing trước khi bị khóa bất biến bởi Task contract.

## 2. Phạm vi (Scope)
- Hỗ trợ flag `--dry-run` cho lệnh `workflow --transition <status>/<checkpoint>`.
- Kiểm tra toàn diện các điều kiện `ready`:
  - Sự tồn tại của ít nhất 1 acceptance criterion và 1 required validation check.
  - Tính hợp lệ của suite-gate.
  - Tồn tại và hợp lệ của `prd.md` và `plan.md` (với ít nhất 1 checklist item) đối với Full task.
  - Kiểm tra các input globs của required checks phải khớp ít nhất một tệp tin.
  - Kiểm tra trạng thái baseline của các required checks (cảnh báo hoặc báo issue nếu check chưa từng chạy hoặc đang fail mà không có waiver).
- Trả về kết quả JSON có cấu trúc rõ ràng với danh sách các issues/blockers mà không thực hiện ghi hoặc thay đổi trạng thái task vào đĩa.
- Bổ sung trường `baseline` vào schema `ValidationCheckV3` cho phép khai báo baseline waiver cho các lỗi pre-existing.
- Không phá vỡ các golden test snapshots hoặc gây lỗi cho các task đã hoàn thành trước đó.

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
- **AC-1**: Hỗ trợ flag `--transition ready/ready --dry-run` để kiểm tra trước các điều kiện freeze mà không lưu state.
- **AC-2**: Cảnh báo hoặc phát hiện các required checks chưa được chạy baseline lần nào hoặc đang fail trước ready freeze.
- **AC-3**: Toàn bộ test suite unit, workflow và acceptance của Harnix vượt qua 100% exit code 0.
