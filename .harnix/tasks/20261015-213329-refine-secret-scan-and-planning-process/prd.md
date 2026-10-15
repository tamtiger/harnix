# PRD: Thu hẹp phạm vi secret scan, nâng cao chất lượng learning note và quy trình planning

## 1. Bối cảnh và Vấn đề
Khi thực thi quy trình phát triển bằng Harnix trên các dự án thực tế, người dùng gặp các ma sát:
1. `scanTaskSecrets` quét toàn bộ input globs (gồm `test/**`), gây false-positive lặp đi lặp lại ở các file test authentication/contract mock (`test/test_api_auth.py`, `test/test_api_contract.py`) dù task không hề chỉnh sửa các file đó.
2. `finishWorkflow` luôn hiển thị hint `No learning captured: record lessons with --add-risk or --add-decision before --finish` ngay cả khi task hoàn toàn chuẩn mực và không có gì đáng ghi. Hơn nữa, cơ chế extract observations tự động gom toàn bộ `task.decisions` làm learning note dù nhiều quyết định chỉ mang tính cục bộ của riêng task.
3. Trong các Epic nhiều task, member tasks được tạo sẵn từ đầu có thể trỏ vào các test file đã bị task trước xóa hoặc đổi tên. Lệnh `resume` không cảnh báo khiến agent chỉ phát hiện lỗi khi chạy verification.
4. Tài liệu `harnix-plan` chưa hướng dẫn rõ việc đối chiếu finding với code thực tế trước khi chốt tiêu chí nghiệm thu của member tasks.

## 2. Mục tiêu
- `scanTaskSecrets`: Hỗ trợ bỏ qua placeholder mở rộng (mock, test credential), hỗ trợ inline/block waiver (`harnix-ignore-secret`) và allowlist/waiver có lý do; không cảnh báo trên các file mock test không bị sửa đổi.
- `learning`: Loại bỏ hint `No learning captured` khi `reviewNotes` rỗng. Phân biệt quyết định cục bộ với bài học tái dùng.
- `resume`: Tự động sanity check các test file trong `validationPlan` của task khi resume và trả về cảnh báo nếu file không tồn tại trên đĩa.
- `harnix-plan`: Bổ sung hướng dẫn đối chiếu finding với code thực tế trước khi đóng băng tiêu chí.
