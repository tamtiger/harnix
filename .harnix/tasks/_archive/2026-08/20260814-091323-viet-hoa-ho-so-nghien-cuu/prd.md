# Yêu cầu Việt hóa hồ sơ nghiên cứu

## Mục tiêu

Việt hóa toàn bộ văn xuôi hướng người đọc trong task `20260814-081624-harness-capability-research` để hồ sơ nhất quán với chính sách ngôn ngữ tiếng Việt mới của Harnix.

## Phạm vi

- `task.json`, `prd.md`, `plan.md`.
- Ba tài liệu trong thư mục `research/`.
- Metadata phát hành bắt buộc khi hoàn tất task.

## Ràng buộc bảo toàn

Giữ nguyên schema field, enum, ID, trạng thái, liên kết bằng chứng, command, đường dẫn, URL, revision, hash, timestamp, code identifier và literal kỹ thuật. Không làm thay đổi ý nghĩa, kết luận hoặc provenance của nghiên cứu.

## Ngoại lệ TDD

Đây là thay đổi thuần tài liệu và dữ liệu mô tả, không thay đổi hành vi runtime. Không có bước RED phù hợp; thay vào đó dùng đối chiếu bất biến, validate TaskRecord, rà soát văn xuôi còn sót và các quality gate hiện có.