# PRD: Chuẩn hóa cấu trúc 4 khối kỹ thuật cho PRD và mô hình Execution Slices cho Plan

## 1. Context & Problem Statement
Bộ tạo tác của Harnix (PRD, Plan, Review) hiện tại chưa có template định hình rõ ràng khi khởi tạo. Khi tạo một Full task, `prd.md` và `plan.md` không được sinh tự động mà người dùng hoặc agent phải tự soạn thảo từ đầu, dễ dẫn đến thiếu sót cấu trúc cần thiết.
Hơn nữa, `prd.md` cần cấu trúc 4 khối kỹ thuật chuẩn (Context & Problem, Scope & Boundaries, Anchored Acceptance Criteria, Architectural & Safety Constraints) và `plan.md` cần mô hình Execution Slices với các check tag liên kết trực tiếp (`[check-id]`) để phục vụ quá trình tự động hóa và đồng bộ tiến độ.

## 2. Scope & Boundaries
- **In-Scope**:
  - Module `src/core/workflow/artifact-templates.ts`: Cung cấp hàm sinh template chuẩn `renderPrdTemplate(task)` và `renderPlanTemplate(task)`.
  - Cập nhật `src/core/workflow/init-task.ts`: Khi khởi tạo task ở chế độ `mode: "full"`, tự động ghi sẵn `prd.md` và `plan.md` chuẩn vào thư mục task nếu chưa tồn tại.
  - Cập nhật `src/core/workflow/ready-content.ts` và `src/core/workflow/ready-artifacts.ts`:
    - Nhận diện check-id dạng `[check-id]` ở đầu checklist item trong `plan.md` (`- [ ] [check-1]`).
    - Khuyến nghị (advisories) khi `prd.md` thiếu một trong 4 khối kỹ thuật cốt lõi (Context, Scope/Boundaries, Criteria, Constraints).
    - Khuyến nghị (advisories) khi `plan.md` thiếu tổ chức theo Execution Slices.
  - Cập nhật tài liệu và hướng dẫn skill `harnix-plan` khi có thay đổi.
- **Out-of-Scope (Non-Goals)**:
  - Tự động tick `[x]` khi run-check pass (đây là phạm vi của Task 3: `20261017-115713-plan-task-sync`).
  - Thay đổi cấu trúc của `review.md` (đây là phạm vi của Task 4: `20261017-115714-review-code-impact`).

## 3. Anchored Acceptance Criteria
- **ac-1**: Template khởi tạo PRD tuân theo cấu trúc 4 khối kỹ thuật (Context & Problem Statement, Scope & Boundaries, Anchored Acceptance Criteria, Architectural & Safety Constraints).
- **ac-2**: Template khởi tạo Plan hỗ trợ Execution Slices và tag liên kết check-id (`[chk-id]`).
- **ac-3**: Cơ chế validation tại ready gate kiểm tra cấu trúc 4 khối của PRD, Execution Slices của Plan và hỗ trợ tag `[chk-id]`.
- **ac-4**: Init task ở mode full tự động sinh file `prd.md` và `plan.md` theo template chuẩn nếu chưa có.

## 4. Architectural & Safety Constraints
- Giữ vững kiến trúc 1 package, 1 executable.
- Không vượt quá 300 LOC trong bất kỳ module mới hoặc đã sửa đổi nào trong `src/core/workflow/`.
- 100% backward compatibility: Các test suite cũ và golden snapshot không bị ảnh hưởng (các kiểm tra cấu trúc mới chỉ đóng vai trò advisories hoặc tương thích với cú pháp hiện có).
