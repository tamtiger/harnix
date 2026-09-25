# PRD — Nâng cấp toàn diện nội dung 21 Engineering Guides cũ

## 1. Bối cảnh và Mục tiêu

Sau khi hoàn thành việc flatten cấu trúc thư mục từ category/name/engineering.md sang category/name.md và bổ sung 13 engineering guides mới đạt tiêu chuẩn kỹ thuật cao (từ 3.000 – 4.700 ký tự với 4 đề mục H2 chuyên sâu), 21 guide files hiện có trong hệ thống vẫn đang ở nội dung ngắn gọn sơ khai (2.000 – 2.600 ký tự). Cần nâng cấp và chuẩn hóa toàn diện 21 guide files cũ này lên cùng đẳng cấp chiều sâu kỹ thuật, giàu tính chỉ dẫn thực chiến và bám sát các phiên bản mới nhất của từng hệ sinh thái.

Yêu cầu cụ thể:
1. Nâng cấp 8 guide ngôn ngữ và common: common.md, typescript.md, javascript.md, python.md, csharp.md, java.md, go.md, php.md.
2. Nâng cấp 7 guide runtime, library và framework: dotnet.md, react-web.md, nestjs.md, spring.md, vue.md, abp.md, codeigniter.md.
3. Nâng cấp 6 guide cơ sở dữ liệu: relational.md, postgresql.md, mysql.md, sqlserver.md, mongodb.md, redis.md.
4. Mỗi guide sau nâng cấp đạt chiều dài từ 3.200 – 4.800 ký tự, có 4 đề mục H2 chuyên sâu, quy tắc kiến trúc và thực hành phòng thủ rõ ràng, không chứa nội dung mang tính giữ chỗ tạm thời.
5. Bảo đảm toàn bộ test suites vượt qua 100%.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)

### AC `ac-upgrade-language-common-guides`
8 guide ngôn ngữ và common được nâng cấp nội dung chuyên sâu, đạt >= 3.000 ký tự và 4 đề mục H2.

### AC `ac-upgrade-framework-runtime-guides`
7 guide runtime, library và framework được nâng cấp kiến trúc thực chiến hiện đại, đạt >= 3.200 ký tự và 4 đề mục H2.

### AC `ac-upgrade-database-guides`
6 guide cơ sở dữ liệu được nâng cấp chuẩn truy vấn, indexing, an toàn giao dịch và connection pooling, đạt >= 3.000 ký tự và 4 đề mục H2.

### AC `ac-guide-quality-and-verification`
Toàn bộ 21 files không chứa nội dung giữ chỗ tạm thời, toàn bộ unit test, lint, typecheck và build pass 100%.
