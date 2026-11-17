# Epic: Cải tiến khả năng dùng của harnix repo-map

Xử lý các điểm đã xác minh là đúng khi dùng repo-map: gợi ý sai ngữ cảnh khi không thấy đường dẫn, --query không trả symbol khớp, --refs thiếu phân biệt khai báo và phân trang, --outline không nhận tên class.

- **Cập nhật:** 2026-11-16 16:51:40 +07:00

## Non-goals

- Không so mốc HEAD cho độ tươi của bản đồ: độ tươi đã được kiểm theo từng file (kích thước, mtime, băm nội dung) và --cached là chủ ý bỏ qua.
- Không đổi giao thức hook: hook vẫn không chạy repo-map.

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261116-165142-repo-map-path-hints` | Gợi ý đường dẫn đúng khi repo-map không tìm thấy file | `lite` | `completed` |
| 2 | `20261116-165143-repo-map-query-symbols` | --query trả đúng symbol khớp từ khóa và cho loại file không phải source | `lite` | `completed` |
| 3 | `20261116-165144-repo-map-refs-detail` | --refs phân biệt khai báo với nơi gọi và cho lấy hết danh sách | `lite` | `completed` |
| 4 | `20261116-165145-repo-map-class-lookup` | --outline nhận tên class và khóa bằng test hành vi overload, partial | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261116-165142-repo-map-path-hints` — Gợi ý đường dẫn đúng khi repo-map không tìm thấy file

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi đường dẫn truyền vào không có trong bản đồ, repo-map trả not-found kèm đường dẫn gần đúng thay vì skipped kèm hint refresh vô ích, và nhận đường dẫn tương đối theo thư mục đang đứng.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261116-165143-repo-map-query-symbols` — --query trả đúng symbol khớp từ khóa và cho loại file không phải source

- **Trạng thái:** `completed`
- **Mục tiêu:** Kết quả --query cho biết symbol nào khớp từ khóa kèm số dòng thay vì 50 tên đầu theo thứ tự chữ cái, và có tùy chọn bỏ file tài liệu.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261116-165144-repo-map-refs-detail` — --refs phân biệt khai báo với nơi gọi và cho lấy hết danh sách

- **Trạng thái:** `completed`
- **Mục tiêu:** --refs đánh dấu đúng khai báo của hàm/phương thức ở mọi ngôn ngữ được hỗ trợ (kể cả C#), giữ dòng nội dung ở dạng compact, và có phân trang để lấy đủ danh sách caller.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261116-165145-repo-map-class-lookup` — --outline nhận tên class và khóa bằng test hành vi overload, partial

- **Trạng thái:** `completed`
- **Mục tiêu:** --outline chấp nhận tên class hoặc symbol khi không có file nào trùng đường dẫn, và hành vi với overload, partial class và tên trùng ở nhiều class được ghim bằng test.
- **Tiêu chí nghiệm thu:** 2 tiêu chí
