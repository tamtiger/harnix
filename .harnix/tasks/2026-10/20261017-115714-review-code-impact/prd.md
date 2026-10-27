# PRD: Nâng cấp báo cáo Review thành Dashboard kiểm chứng tích hợp Code Impact

## 1. Context & Problem Statement
File `review.md` đóng vai trò là bảng thông tin trực quan phục vụ con người đánh giá kết quả của task (human review surface).
Hiện tại, `review.md` chưa thống kê được tác động mã nguồn (Code Impact: các file nào đã được tạo mới, chỉnh sửa, xóa và độ lớn dòng mã +/-), khiến người đánh giá phải mở `git diff` hoặc kiểm tra thủ công.
Cần bổ sung mục Code Impact vào `review.md` để hiển thị trực quan các tệp thay đổi và độ biến thiên dòng mã, đồng thời bảo đảm không ảnh hưởng đến tính ổn định của snapshot và schema trước đó.

## 2. Scope & Boundaries
- **In-Scope**:
  - Mở rộng kiểu dữ liệu `CodeImpactItem` và `ReviewArtifacts` trong `src/core/tasks/task-review.ts`.
  - Hiện thực hàm `renderCodeImpact` hiển thị bảng Code Impact (File, Status, Changes) khi có dữ liệu.
  - Tích hợp `renderCodeImpact` vào hàm `renderTaskReview`.
  - Bảo đảm không hiển thị mục này khi không có dữ liệu code impact, duy trì 100% tương thích ngược và không làm thay đổi golden snapshot.
- **Out-of-Scope (Non-Goals)**:
  - Tự động chạy git diff ngoài ý muốn hoặc đòi hỏi git repository cục bộ khi không có cấu hình.
  - Thay đổi cấu trúc các section header cốt lõi (Goal, Summary, Acceptance criteria, Required checks, Evidence).

## 3. Anchored Acceptance Criteria
- **ac-1**: `review.md` hiển thị bảng Code Impact thống kê file thay đổi khi có dữ liệu code impact.
- **ac-2**: Bảng Code Impact hiển thị chính xác trạng thái file (added, modified, deleted) và số dòng thay đổi (+/-).
- **ac-3**: Giữ nguyên tính tương thích 100% khi task không có code impact (không làm vỡ golden snapshot).

## 4. Architectural & Safety Constraints
- Giữ file `src/core/tasks/task-review.ts` dưới 300 LOC logic.
- Không đưa machine-specific absolute paths hay bí mật vào review markdown.
