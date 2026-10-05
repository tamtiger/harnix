# Kế hoạch thực hiện (Plan) - Task 2: Atomic Replace Check

## Danh sách công việc (Checklist)
- [x] Slice 1: Cập nhật `assertEvidencedChecksRetained` trong `src/core/workflow/obligations.ts` cho phép replacement check hợp lệ là check mới HOẶC check chưa có passing evidence.
- [x] Slice 2: Hiện thực hàm `replaceCheckWorkflow` trong `src/core/workflow/plan-edit.ts` thực hiện retirement check cũ và kích hoạt check mới atomic trong một transaction.
- [x] Slice 3: Tích hợp flag `--replace-check` vào `src/commands/workflow-flags.ts` và `src/commands/workflow-command.ts`.
- [x] Slice 4: Bổ sung unit tests cho `replaceCheckWorkflow` trong `test/unit/core/workflow/plan-edit.test.ts` (RED -> GREEN).
- [x] Slice 5: Chạy toàn bộ kiểm thử xác thực `check-replace-command` và `check-suite` bảo đảm 100% exit code 0.

---

## Chi tiết các lát cắt thực hiện

### Slice 1: Nới lỏng điều kiện replacement trong obligations.ts
- **Tệp chỉnh sửa:** `src/core/workflow/obligations.ts`
- **Mô tả:** Trong `assertEvidencedChecksRetained`, cho phép `replacement` là một check mới (`!priorCheckIds.has(replacement.id)`) HOẶC là check đã có trong `previous` nhưng chưa từng có passing evidence và không phải là chính check đang bị retire (`replacement.id !== check.id`). Điều này giúp nếu agent lỡ khai báo trước check thay thế thì vẫn retire được check cũ.

### Slice 2 & 3: Atomic replace transport
- **Tệp chỉnh sửa:**
  - `src/core/workflow/plan-edit.ts`
  - `src/commands/workflow-flags.ts`
  - `src/commands/workflow-command.ts`
  - `src/commands/internal-workflow.ts`
- **Mô tả:**
  - Hàm `replaceCheckWorkflow(root, { oldId, newId, edit?: CheckEdit, reason }, options)`:
    - Tìm `oldCheck` trong active task: phải tồn tại, `required === true`, không có passing evidence.
    - Tạo `oldRetired`: `{ ...oldCheck, required: false }`.
    - Tạo `newCheck`: nếu `newId` đã có trong `validationPlan`, đặt `required = true`, kiểm tra bao phủ đủ `oldCheck.criterionIds`. Nếu `newId` chưa có, dùng các tham số truyền vào từ CLI (`--description`, `--command`, `--scope`, `--input`, `--criteria`) để khởi tạo check mới với `required = true` và `criterionIds` bao phủ `oldCheck.criterionIds`.
    - Thực hiện lưu atomic với `checkpoint: "replan"` và `contractRevision: { reason }`.
  - Commander CLI: Hỗ trợ `--replace-check <old-id> <new-id>` kết hợp `--reason <reason>` và các cờ check bổ sung.

### Slice 4: Unit Testing (RED -> GREEN)
- **Tệp chỉnh sửa:** `test/unit/core/workflow/plan-edit.test.ts`
- **Mô tả:**
  - Viết test thay thế một failed check bằng một check mới khai báo inline.
  - Viết test thay thế bằng một check đã tồn tại sẵn trong validationPlan.
  - Viết test kiểm tra từ chối khi check cũ đã pass, hoặc check mới không cover đủ criterionIds, hoặc thiếu reason.

### Slice 5: Verification & Safety
- Chạy các required checks:
  - `pnpm vitest run test/unit/core/workflow/plan-edit.test.ts`
  - `pnpm run test:acceptance`
- Kiểm tra tính toàn vẹn của TaskRecord và tuân thủ các quy tắc bất biến của Harnix.
