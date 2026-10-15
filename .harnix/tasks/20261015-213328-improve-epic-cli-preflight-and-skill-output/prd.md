# PRD: Cải tiến CLI khởi tạo Epic, nạp file UTF-8, chuyển đổi task và DX

## 1. Bối cảnh & Vấn đề
- Khi khởi tạo Epic hoặc cập nhật task phức tạp, người dùng hiện phải truyền JSON qua stdin pipe. Trên Windows (đặc biệt là PowerShell 5.1/cmd), việc pipe thường làm hỏng encoding tiếng Việt thành ký tự `???` hoặc dính lỗi syntax quoting / unexpected EOF.
- Thiếu cờ nạp file `--file <path>` trực tiếp cho `workflow --save`, `--batch`, `--migrate` và `epic` để đọc tệp UTF-8 an toàn mà không cần qua shell pipe.
- Thiếu cơ chế phát hiện suy giảm chất lượng dữ liệu văn bản (lossy conversion thành chuỗi `???`) trong `text-integrity.ts` để chủ động ngăn chặn việc lưu dữ liệu tiếng Việt bị hỏng.
- Khi muốn chuyển nhanh sang task tiếp theo của một epic đang dở, lệnh `harnix resume` yêu cầu phải chạy `harnix pause` trước; đồng thời không có cờ `--next` để tự tìm task kế tiếp trong epic.
- Cần bổ sung các cờ tiện ích `--set-title` và `--set-goal` cho `harnix workflow` để sửa thông tin cơ bản của task mà không cần soạn JSON envelope.
- `harnix status` và `workflow --preflight` khi không có `activeTask` chưa hiển thị rõ thông tin về `epicContext` và gợi ý `nextTask` cùng lệnh `resume <id>`.
- `harnix skill` trả về JSON bọc nội dung, gây bất tiện khi đọc nhanh trên terminal; cần cờ `--raw` để in trực tiếp Markdown.
- Thư mục cache nội bộ `.harnix/cache/` (như repo-map cache) chưa có trong `.gitignore` mặc định và việc tự động làm mới file quản lý chưa có log tóm tắt rõ ràng.

## 2. Mục tiêu
- Hỗ trợ nạp cấu hình Epic và Task từ file `--file <path>` cho các lệnh workflow và epic.
- Bổ sung kiểm tra integrity phát hiện chuỗi `???` (lossy encoding) khi lưu text tiếng Việt.
- Bổ sung cờ `--force` (tự động pause task cũ nếu có) và `--next` cho `harnix resume`.
- Bổ sung cờ `--set-title <text>` và `--set-goal <text>` cho `harnix workflow`.
- Cải thiện `harnix status` và `workflow --preflight` hiển thị `epicContext`, `nextTask` và câu lệnh `resume`.
- Thêm cờ `--raw` cho `harnix skill <name>`.
- Đưa `.harnix/cache/` vào `.gitignore` mẫu và hiển thị thông báo tóm tắt khi cập nhật managed files.

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
- `ac-1`: Hỗ trợ nạp cấu hình Epic và Task từ file (`--file`) cho workflow `--save`, `--batch`, `--migrate` và khởi tạo Epic, loại bỏ rủi ro hỏng encoding từ stdin pipe.
- `ac-2`: Bổ sung cơ chế phát hiện lỗi mất dấu tiếng Việt (lossy conversion `???`) trong `text-integrity.ts` để chặn lưu dữ liệu hỏng.
- `ac-3`: Hỗ trợ cờ `--force` và cờ `--next` cho `harnix resume` để kích hoạt task tiếp theo của epic một cách thuận tiện.
- `ac-4`: Bổ sung cờ `--set-title` và `--set-goal` cho `harnix workflow` để cập nhật tiêu đề và mục tiêu nhanh chóng.
- `ac-5`: `harnix status` và `workflow --preflight` gợi ý rõ ràng `epicContext`, `nextTask` và lệnh `resume` khi không có `activeTask`.
- `ac-6`: `harnix skill` hỗ trợ cờ `--raw` để in trực tiếp nội dung Markdown ra terminal.
- `ac-7`: `.harnix/cache/` được đưa vào `.gitignore` mặc định và hiển thị log rõ ràng khi file quản lý thay đổi.
