# PRD: Xây dựng cơ chế tự động đồng bộ hai chiều giữa Plan checklist và Task state

## 1. Context & Problem Statement
Trong mô hình làm việc với agent, checklist trong `plan.md` thường bị lệch pha (out-of-sync) so với trạng thái kiểm chứng thực tế trong `task.json`.
Cụ thể, khi một check vượt qua kiểm thử thành công (pass với exit code 0) thông qua lệnh `workflow --run-check` hoặc `workflow --evidence`, checklist item tương ứng trong `plan.md` vẫn có thể ở trạng thái chưa đánh dấu `- [ ]`, dẫn đến việc lập trình viên hoặc agent phải tự sửa tay hoặc bị chặn ở bước chuyển trạng thái verifying.
Cần một cơ chế tự động tìm và cập nhật các checklist item có gắn tag `[check-id]` (hoặc \`check-id\`) từ `- [ ]` sang `- [x]` khi check đó ghi nhận kết quả `pass`.

## 2. Scope & Boundaries
- **In-Scope**:
  - Module `src/core/workflow/plan-sync.ts`: Cung cấp hàm `syncPlanChecklistPass(harnixRoot, taskId, checkId)`.
  - Tích hợp vào `appendEvidenceFlagsWorkflow` trong `src/core/workflow/evidence-flags.ts`: Khi `result === "pass"`.
  - Tích hợp vào `appendEvidenceWorkflow` trong `src/core/workflow/evidence.ts`: Khi `evidence.result === "pass"`.
  - Tự động nhận diện cả các định dạng tag check: `[check-id]`, \`check-id\` hoặc `check-id` đứng đầu item.
  - Bỏ qua an toàn (no-op) nếu file `plan.md` không tồn tại (Lite mode) hoặc không có item nào khớp.
- **Out-of-Scope (Non-Goals)**:
  - Tự động uncheck `- [x]` thành `- [ ]` khi check fail (vì một slice có thể đã hoàn thành trước đó, không đảo ngược lịch sử).
  - Tự ý thay đổi nội dung văn bản ngoài dấu tick checkbox.

## 3. Anchored Acceptance Criteria
- **ac-1**: Lệnh `--run-check` tự động chuyển `- [ ]` thành `- [x]` trong `plan.md` khi check pass với exit code 0.
- **ac-2**: Ghi nhận evidence pass qua `--evidence` cũng tự động đồng bộ checklist trong `plan.md`.
- **ac-3**: Bảo toàn nguyên vẹn các checklist items khác và bỏ qua an toàn khi không tìm thấy `plan.md`.

## 4. Architectural & Safety Constraints
- Giữ file `plan-sync.ts` và các file liên quan dưới 300 LOC logic.
- Không gây side effect khi check fail hoặc skipped.
- Không làm thay đổi hash đầu vào (inputDigest) của các check.
