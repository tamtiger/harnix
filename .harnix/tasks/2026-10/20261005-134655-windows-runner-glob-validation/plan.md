# Kế hoạch thực hiện (Plan)

## Danh sách công việc (Checklist)
- [x] Slice 1: Khắc phục `resolveInvocation` trong `src/utils/check-runner.ts` hỗ trợ `.cmd`, `.bat` và launcher shims trên Windows.
- [x] Slice 2: Bổ sung unit tests cho Windows `.cmd` launcher trong `test/unit/utils/check-runner.test.ts` (RED -> GREEN).
- [x] Slice 3: Cải thiện thông báo lỗi rỗng input glob trong `src/core/verification/input-digest.ts` và `src/core/tasks/task-validate-contracts.ts`.
- [x] Slice 4: Bổ sung unit tests chẩn đoán input globs trong `test/unit/core/verification/input-digest.test.ts` và `test/unit/core/tasks/task-validate-contracts.test.ts` (RED -> GREEN).
- [x] Slice 5: Chạy toàn bộ kiểm thử xác thực `check-windows-runner`, `check-input-globs`, và `check-suite` bảo đảm 100% exit code 0.

---

## Chi tiết các lát cắt thực hiện

### Slice 1 & 2: Windows Check Runner Invocation Fix (ac-1)
- **Tệp chỉnh sửa:**
  - `src/utils/check-runner.ts`
  - `test/unit/utils/check-runner.test.ts`
- **Mô tả kỹ thuật:**
  - Hiện tại: `const bareName = !/[\\/]/u.test(executable) && !executable.includes(".");`
  - Cần nâng cấp: Một lệnh trên Windows cần qua `cmd.exe /d /s /c` nếu:
    1. Là bare name không có phần mở rộng (ví dụ `pnpm`, `npm`, `npx`).
    2. Hoặc kết thúc bằng `.cmd` hay `.bat` (ví dụ `npm.cmd`, `C:\\Program Files\\nodejs\\npm.cmd`).
  - Đảm bảo kiểm tra an toàn ký tự `CMD_METACHARACTERS` vẫn được thực thi nghiêm ngặt trên mọi lệnh qua route `cmd.exe`.
- **Thực hiện theo TDD (RED -> GREEN):**
  - Viết test trong `test/unit/utils/check-runner.test.ts` kiểm tra `resolveInvocation("npm.cmd", ["test"], "win32")` và `resolveInvocation("C:\\tools\\npm.cmd", ["test"], "win32")` phải được bọc trong `cmd.exe /d /s /c`.
  - Cập nhật logic `resolveInvocation` để test chuyển sang màu xanh (GREEN).

### Slice 3 & 4: Cải thiện chẩn đoán Input Globs (ac-2)
- **Tệp chỉnh sửa:**
  - `src/core/verification/input-digest.ts`
  - `src/core/tasks/task-validate-contracts.ts`
  - `test/unit/core/verification/input-digest.test.ts`
  - `test/unit/core/tasks/task-validate-contracts.test.ts`
- **Mô tả kỹ thuật:**
  - Trong `src/core/verification/input-digest.ts`: Thay vì ném lỗi `Verification input pattern for check ${checkId} matched no files.` chung chung, ghi nhận rõ ràng: `Verification input pattern "${input}" for check ${checkId} matched no files in repository.`
  - Trong `src/core/tasks/task-validate-contracts.ts`: Trong hàm `assertV3CheckInputs(check)`, nếu `check.inputs` rỗng, hoặc có pattern không an toàn, hoặc không sorted-unique, ném `TaskValidationError` có kèm `check.id` và nguyên nhân cụ thể (ví dụ: `TaskRecord v3 validation inputs for check "${check.id}" are invalid: ...`).
- **Thực hiện theo TDD (RED -> GREEN):**
  - Viết test kiểm tra thông báo lỗi cụ thể khi truyền pattern không khớp file nào.
  - Cập nhật hàm ném lỗi trong `input-digest.ts` và `task-validate-contracts.ts`.

### Slice 5: Verification & Safety (ac-3)
- Chạy các required checks đã khai báo:
  - `pnpm vitest run test/unit/utils/check-runner.test.ts`
  - `pnpm vitest run test/unit/core/tasks/task-validate-contracts.test.ts test/unit/core/verification/input-digest.test.ts`
  - `pnpm run test:acceptance`
- Đảm bảo tuân thủ kiến trúc và các quy định an toàn của Harnix.
