# PRD: Nhắc đặt baseline khi suite đỏ lặp qua nhiều task

## Vấn đề

Khi một suite đã đỏ sẵn qua nhiều task liên tiếp (ví dụ do repo khác hay môi trường), agent lại phải tự lách ở từng task, thường bằng cách đặt suite là `required: false`, thay vì xin người dùng ủy quyền baseline bằng `harnix workflow --set-baseline`. Harnix không nói gì để nhắc.

## Mục tiêu

`harnix workflow --preflight` trả thêm một trường `baselineHint` (một dòng) khi task đang ở `in_progress` hoặc `verifying` và suite của task này trông giống một suite đỏ lặp lại.

## Hành vi

- Suite = check `scope: full` có command khai báo. So khớp theo `normalizeCommand` (cùng command sau chuẩn hóa).
- Điều kiện: trong các task đã kết thúc (`completed` hoặc `cancelled`) gần nhất của project (đọc tối đa 8 thư mục task mới nhất, bỏ task active và task đọc lỗi), 2 task mới nhất có check suite cùng command đều "đỏ": evidence mới nhất của check là `fail`, hoặc check có `baseline.result` là `fail`. Check của task hiện tại chưa có baseline được ủy quyền (`authorizedBy`).
- Gợi ý một dòng, nêu id check và lệnh `harnix workflow --set-baseline <id> --result fail --classification pre-existing --authorized-by user --scope "<lý do>"`, kèm lời nói rõ chỉ chạy khi người dùng đã ủy quyền; Harnix không tự đặt baseline và không đổi cổng suite.
- Không có trường khi không thỏa điều kiện; `--preflight --brief` giữ nguyên trường (chỉ bỏ `learning`).
- Chỉ đọc `.harnix/tasks` cục bộ: không mạng, không dữ liệu toàn cục mới.

## Ngoài phạm vi

- Không tạo baseline cấp repo (một lần cho cả repo): cần lưu dữ liệu mới, để một task riêng nếu cần.
- Không so sánh danh sách test lỗi giữa các task (cần danh tính từng test).

## Rủi ro

Heuristic theo command và scope `full` có thể bỏ sót suite đặt tên hay command khác; chỉ là gợi ý nên chấp nhận. Mỗi lần preflight đọc tối đa 8 task nhỏ ở `in_progress`/`verifying`.
