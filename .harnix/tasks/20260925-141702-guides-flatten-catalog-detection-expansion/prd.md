# PRD — Flatten cấu trúc src/guides/, mở rộng ngôn ngữ/framework và cập nhật Catalog Auto-Detection

## 1. Mục tiêu và Bối cảnh

Hệ thống engineering guides hiện tại của Harnix đang phân tán thành cấu trúc thư mục lồng nhau dạng category/name/engineering.md. Mặc dù phục vụ tốt việc tổ chức ban đầu, cấu trúc này gây cồng kềnh khi mỗi thư mục chỉ chứa đúng 1 file engineering.md.

Yêu cầu đặt ra là:
1. Flatten toàn bộ 21 guide files hiện tại thành category/name.md.
2. Mở rộng độ phủ thêm 5 ngôn ngữ lập trình phổ biến (rust, kotlin, swift, dart, cpp).
3. Mở rộng thêm 8 frameworks phổ biến (nextjs, fastapi, django, laravel, express, angular, gin, axum).
4. Cung cấp context chuẩn của từng stack trong từng guide: conventions, kiến trúc khuyến nghị, kiểm thử, quản lý cấu hình và bảo mật.
5. Cập nhật catalog và thuật toán auto-detection không thêm thư viện bên ngoài mà dùng pattern matching an toàn trên file manifests.
6. Bảo đảm mỗi guide mới đạt tiêu chuẩn chất lượng: độ dài >= 2.000 ký tự, tối thiểu 3 đề mục H2, tính hành động cao.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)

### AC `ac-flatten-guide-structure`
Toàn bộ 21 files trong src/guides/ được chuyển từ category/name/engineering.md sang category/name.md. Xóa sạch các thư mục rỗng. Cập nhật đường dẫn contentPath trong src/guides/catalog.ts và các spec paths tương ứng.

### AC `ac-stack-expansion-guides`
Bổ sung 5 ngôn ngữ mới (rust, kotlin, swift, dart, cpp) và 8 frameworks mới (nextjs, fastapi, django, laravel, express, angular, gin, axum) với nội dung chuyên sâu và context chuẩn của từng stack.

### AC `ac-catalog-and-detection`
Cập nhật src/catalog/types.ts, src/catalog/catalog.ts và src/utils/detection.ts hỗ trợ nhận diện và cấu hình đầy đủ cho các ngôn ngữ và framework mới thông qua manifest detection an toàn.

### AC `ac-guide-quality-and-tests`
Mỗi guide mới đạt chuẩn chất lượng: dung lượng >= 2.000 ký tự, tối thiểu 3 đề mục H2, không có nội dung giữ chỗ tạm thời. Toàn bộ unit tests (catalog.test.ts, detection.test.ts, rules.test.ts) và build/typecheck/lint pass 100%.
