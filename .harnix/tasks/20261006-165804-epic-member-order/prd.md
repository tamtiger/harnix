# PRD: Thứ tự chạy rõ ràng của epic

## Vấn đề

`harnix epic <id>` luôn chọn task kế tiếp theo ID tăng dần; khi người dùng đổi ưu tiên, không có cách khai báo thứ tự khác mà không tạo lại task.

## Thiết kế

`EpicRecord` có field tùy chọn `order` (danh sách task ID, không trùng, đúng regex task). Member nằm trong `order` đi trước theo đúng thứ tự đó, phần còn lại theo ID tăng dần; `nextTask` là member chưa terminal đầu tiên theo thứ tự này, và file epic `.md` hiển thị cùng thứ tự. Epic cũ không có field giữ nguyên hành vi. Lệnh `harnix workflow --epic-order <epic-id> <task-id>...` kiểm mọi id là member của epic, ghi `order` và `updatedAt` vào bản ghi epic rồi sinh lại `.md`, không đọc hay ghi `task.json` của task nào.

## Không thuộc phạm vi

Không đổi ID task; không đổi epic cũ không khai báo thứ tự; `--save` với `epicMembers` vẫn đòi ID tăng dần.

## Tiêu chí chấp nhận

### ac-1: Field `order`

Có field tùy chọn `order` được validate (chuỗi ID đúng dạng, không trùng); epic cũ không có field vẫn đọc bình thường.

**Verifies:** `check-epic-order` cùng `check-suite`.

### ac-2: Chọn task kế tiếp và hiển thị

`harnix epic <id>` chọn `nextTask` theo `order` trước, phần còn lại theo ID; `.md` hiển thị đúng thứ tự.

**Verifies:** `check-epic-order` cùng `check-suite`.

### ac-3: Lệnh cập nhật

`harnix workflow --epic-order <epic-id> <task-ids>` cập nhật `order`, từ chối id không thuộc epic hoặc trùng, và không ghi `task.json`; có test.

**Verifies:** `check-epic-order` cùng `check-suite`.

### ac-4: Tài liệu

Tài liệu hợp đồng đóng băng và reference `epic` mô tả `order` và quy tắc chọn task kế tiếp.

**Verifies:** `check-docs` cùng `check-suite`.
