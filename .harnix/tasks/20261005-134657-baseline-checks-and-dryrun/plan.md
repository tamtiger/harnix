# Kế hoạch thực hiện (Plan) - Task 3: Baseline Checks & Dry-run Transition

## Danh sách công việc (Checklist)
- [x] Slice 1: Mở rộng `ValidationCheckV2Keys` trong `src/core/tasks/task-schema.ts` và `task-validate.ts` để hỗ trợ trường `baseline` waiver (optional).
- [x] Slice 2: Hiện thực logic kiểm tra ready conditions và baseline status trong `src/core/workflow/ready.ts` (kiểm tra criteria, suite-gate, artifacts, input globs, và baseline evidence).
- [x] Slice 3: Bổ sung hỗ trợ `dryRun` vào `transitionWorkflow` trong `src/core/workflow/transition.ts` và flag `--dry-run` trong `src/commands/workflow-flags.ts` & `src/commands/workflow-command.ts`.
- [x] Slice 4: Viết unit tests TDD cho `--transition ready/ready --dry-run` trong `test/unit/core/workflow/transition.test.ts` (RED -> GREEN).
- [x] Slice 5: Chạy toàn bộ các required checks và kiểm thử hồi quy để bảo đảm 100% exit code 0.

---

## Chi tiết các lát cắt thực hiện

### Slice 1: Schema hỗ trợ baseline waiver
- Thêm `"baseline"` vào `validationCheckV2Keys` trong `src/core/tasks/task-schema.ts`.
- Thêm type `CheckBaselineWaiver` vào `src/core/tasks/task-schema.ts`.
- Kiểm tra hợp lệ object `baseline` trong `src/core/tasks/task-validate.ts`.

### Slice 2: Ready conditions inspection & baseline checking
- Tạo hàm `checkReadyConditions(harnixRoot, task, artifacts?)` trong `src/core/workflow/ready.ts` trả về danh sách các issues (blockers) nếu có.
- Kiểm tra:
  - Criteria >= 1
  - Required checks >= 1
  - Suite gate ready
  - Full task artifacts (prd.md, plan.md có checklist)
  - Input globs match ít nhất 1 file
  - Required checks baseline status: check chưa từng có evidence hoặc fail mà không có waiver.

### Slice 3: Tích hợp CLI --transition --dry-run
- `src/commands/workflow-flags.ts`: Thêm `dryRun?: boolean` vào `WorkflowFlags` và khai báo owner cho `--dry-run` với action `transition`.
- `src/commands/workflow-command.ts`: Cấu hình `.option("--dry-run", "...")` và truyền `dryRun` vào `transitionWorkflow`.
- `src/core/workflow/transition.ts`: Khi `dryRun === true`, gọi `checkReadyConditions` và trả về kết quả `DryRunTransitionResult` mà không gọi `saveWorkflow`.

### Slice 4: TDD Unit Tests
- Thêm tests trong `test/unit/core/workflow/transition.test.ts`:
  - Test `--transition ready/ready --dry-run` khi task hợp lệ -> trả về `valid: true`, `issues: []`.
  - Test `--transition ready/ready --dry-run` khi check chưa baselined -> trả về `valid: false`, `issues` chứa thông báo unbaselined.
  - Test `--transition ready/ready --dry-run` khi check có baseline waiver -> trả về `valid: true`.
  - Test `--transition ready/ready --dry-run` khi input glob rỗng -> trả về `valid: false` chỉ rõ glob.

### Slice 5: Verification & Safety
- Chạy `check-baseline-dryrun` (`pnpm vitest run test/unit/core/workflow/transition.test.ts`).
- Chạy `check-suite` (`pnpm run test:acceptance`).
