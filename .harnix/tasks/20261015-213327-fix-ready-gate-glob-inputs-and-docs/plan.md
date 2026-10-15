# Kế hoạch thực hiện: Ready Gate Glob Inputs, Batch Reporting và Chuẩn hoá Tài liệu

## 1. Danh sách công việc (Checklist)
- [x] Thêm unit tests cho `coversSource` với các thư mục source phổ biến (`core/**/*.py`, `models/**`, `services/**/*.ts`) trong `test/unit/core/workflow/suite-gate.test.ts` (RED cho `ac-1`).
- [x] Mở rộng `SOURCE_SEGMENTS` và cải thiện logic `coversSource` trong `src/core/workflow/suite-gate.ts` (GREEN cho `ac-1`).
- [x] Thêm unit tests và triển khai gom toàn bộ lỗi (batch issue reporting) trong `src/core/workflow/ready.ts` (GREEN cho `ac-2`).
- [x] Tinh chỉnh thông báo lỗi checklist `plan.md` trong `src/core/workflow/ready-artifacts.ts` (GREEN cho `ac-3`).
- [x] Rà soát và cập nhật làm sạch tài liệu trong `src/templates/harnix/workflow.md` và `.harnix/workflow.md` (GREEN cho `ac-4`).
- [x] Chạy `pnpm selfhost:sync` nếu template thay đổi, bump version `2.7.0-dev.2`, kiểm tra `check-gates` và `check-suite` pass 100%.

## 2. Thiết kế chi tiết & Tác động tập tin
- `src/core/workflow/suite-gate.ts`:
  - Mở rộng `SOURCE_SEGMENTS`: bổ sung `core`, `models?`, `services?`, `domain`, `infra(structure)?`, `backend`, `frontend`, `api`, `server`, `client`.
  - Cải tiến thông báo lỗi khi không tìm thấy suite check: phân tích xem thiếu source hay thiếu test và gợi ý các glob hợp lệ.
- `src/core/workflow/ready.ts`:
  - `assertReadyRequirements`: Thay vì chỉ ném lỗi đầu tiên (`throw new Error(first)`), gom toàn bộ mảng `issues` thành một danh sách có định dạng bullet: `Workflow ready requirements failed:\n- issue 1\n- issue 2...` để người dùng sửa một lần.
- `src/core/workflow/ready-artifacts.ts`:
  - Thông báo lỗi khi checklist rỗng hoặc đều đã tick: ghi rõ `plan.md requires at least one unchecked checklist item (- [ ]) for implementation progress tracking`.
- `src/templates/harnix/workflow.md`:
  - Rà soát làm sạch mọi mô tả schema v2 và `@task-contract`.

## 3. Ánh xạ tiêu chí nghiệm thu và Kiểm chứng
- `ac-1`: Được kiểm chứng qua unit test trong `test/unit/core/workflow/suite-gate.test.ts`.
- `ac-2`: Được kiểm chứng qua unit test trong `test/unit/core/workflow/ready.test.ts`.
- `ac-3`: Được kiểm chứng qua unit test trong `test/unit/core/workflow/ready-artifacts.test.ts`.
- `ac-4`: Được kiểm chứng qua `test/workflow/docs-task-contract.test.ts` và `check-gates`.
