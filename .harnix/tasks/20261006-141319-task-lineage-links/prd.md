# PRD: Ghi nhận quan hệ task nối tiếp và gắn epic ngay lúc init

## Vấn đề

Phản hồi thực tế từ phiên VNPAY POS: ba task tinh chỉnh liên tiếp bị rời rạc.

- `harnix workflow --init` không có cách gắn task vào epic có sẵn, nên người dùng quên gắn và không sửa hồi tố được (task completed là terminal).
- `--follow-up <task-id>` có chạy (sao chép `relevantPaths`, `relevantSpecs`, `epicId` của task gốc) nhưng không ghi quan hệ nào vào task mới. Task gốc không có epic thì không có tín hiệu nào cho người dùng.
- `status`, `tasks` và `review.md` không cho thấy task thuộc epic nào hay nối tiếp task nào.

## Mục tiêu

1. `--init --epic <epic-id>` gắn task vào epic đã tồn tại ngay lúc tạo; epic không tồn tại thì báo lỗi.
2. `--follow-up <task-id>` ghi field tùy chọn `followUpOf` (additive, không đổi `schemaVersion`), kế thừa epic của task gốc và nói rõ khi task gốc không có epic.
3. `review.md` và `harnix tasks` hiển thị `epicId` và `followUpOf` khi có. `harnix status` giữ nguyên vì là micro projection dưới 80 token.
4. Task v3 cũ không có field vẫn đọc và validate bình thường.
5. Tài liệu mô tả `--epic`, `followUpOf` và lý do không hỗ trợ gắn hồi tố hay reopen.

## Không làm

- Không gắn epic hồi tố vào task đã completed, không sửa `task.json` của task terminal.
- Không thêm reopen/amend cho task completed.
- Không đổi `schemaVersion` và không thêm epic tự động cho task lẻ.

## Quyết định

- `followUpOf` là chuỗi task ID hợp lệ; tồn tại task gốc được kiểm tra lúc `--init` (đã có sẵn), không kiểm tra lại khi đọc.
- `--epic` và `--follow-up` dùng được cùng nhau khi cùng epic; nếu task gốc thuộc epic khác với `--epic` thì từ chối và nêu cả hai epic, để không gắn nhầm.
- Hiển thị trong `tasks` chỉ thêm khóa tùy chọn khi có giá trị, để output của task không có liên kết giữ nguyên.
- Task gốc không có epic và không có `--epic`: không phải lỗi; task vẫn được tạo, stdout vẫn là JSON, một dòng `notice: ...` in ra stderr.
- Phiên bản của task này là `2.2.0-dev.2`: `scripts/version-sync.mjs` đã hỗ trợ tiền phát hành (`parseVersion`, `comparePrereleases`), không phụ thuộc Task 6.
- `src/core/workflow/init-task.ts` hiện có 103 dòng; logic `--epic` và `followUpOf` (khoảng 40 dòng) ở lại trong chính file đó, không tách file mới.
