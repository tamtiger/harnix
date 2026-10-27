# PRD: Mở rộng nhận diện glob source trong ready gate, báo lỗi batch và chuẩn hoá tài liệu

## 1. Bối cảnh & Vấn đề
- Cổng kiểm tra Ready Gate (`suite-gate.ts`) sử dụng hàm `coversSource` để xác nhận inputs của suite check có bao phủ mã nguồn hay không. Hiện tại, `SOURCE_SEGMENTS` chỉ hỗ trợ một danh sách cố định hẹp (`src`, `lib`, `app`, `pkg`, `cmd`, `internal`). Khi dự án tổ chức code trong các thư mục như `core/`, `models/`, `services/`, `modules/`, glob `core/**/*.py` bị từ chối trong khi `core/**` thì được chấp nhận (do `isTree` chỉ đúng khi kết thúc bằng `**`).
- Khi chuyển đổi task sang `ready/ready`, hàm `assertReadyRequirements` trong `ready.ts` chỉ ném lỗi đầu tiên tìm thấy (`first`). Người dùng hoặc agent phải sửa từng lỗi một qua nhiều vòng thử sai lặp đi lặp lại.
- Khi người dùng đánh dấu hoàn tất checklist trong `plan.md` trước lúc ready, thông báo lỗi thiếu checklist gây khó hiểu nếu không có giải thích rõ ràng.
- Tài liệu hướng dẫn và template `workflow.md` vẫn còn chứa các đoạn mô tả cũ về schema v2 và token `@task-contract`, gây nhầm lẫn.

## 2. Mục tiêu
- Mở rộng nhận diện source directory trong `coversSource`: hỗ trợ các thư mục source phổ biến (`core`, `models`, `services`, `modules`, `domain`, `infra`, `api`...).
- Thay đổi cơ chế báo lỗi của `assertReadyRequirements`: gom và trả về toàn bộ danh sách các vi phạm cùng lúc (batch reporting), kèm danh sách glob gợi ý hợp lệ.
- Cải thiện thông báo lỗi và hướng dẫn rõ ràng cho điều kiện checklist `- [ ]` trong `plan.md`.
- Rà soát làm sạch dứt điểm mọi tham chiếu schema v2 và token `@task-contract` trong tài liệu và template.

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
- `ac-1`: `coversSource` nhận diện các thư mục source phổ biến (như `core`, `models`, `services`, `modules`) ngay cả khi dùng glob file như `core/**/*.py`.
- `ac-2`: `assertSuiteGateReady` và ready gate gom và báo toàn bộ các lỗi cùng lúc (batch error reporting) thay vì báo từng vòng đơn lẻ.
- `ac-3`: Cải thiện thông báo lỗi và hướng dẫn rõ ràng cho điều kiện checklist `- [ ]` chưa tick trong `plan.md`.
- `ac-4`: Tài liệu và template `workflow.md` được rà soát và loại bỏ sạch sẽ mọi hướng dẫn sót về schema v2 và token `@task-contract`.
