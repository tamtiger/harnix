# Plan - Multi-repo Workspace Roots, Follow-up Task Lifecycle & Baseline Checks

## 1. Danh sách Files & Modules bị ảnh hưởng
- `src/core/tasks/task-schema.ts`: Cập nhật schema `ValidationCheck` hỗ trợ trường `cwd?: string`.
- `src/utils/check-runner.ts`: Hỗ trợ option `cwd` trong `CheckRunnerOptions` và truyền vào `spawnProcess`.
- `src/core/workflow/run-check.ts`: Đọc `check.cwd` (hoặc cờ `--cwd`) và truyền vào runner. Cho phép chạy ở cả giai đoạn `planning` để thu thập bằng chứng baseline.
- `src/core/workflow/init.ts`: Hỗ trợ tùy chọn `followUpTaskId?: string` trong `InitTaskOptions`, đọc task cũ và kế thừa `relevantPaths`, `relevantSpecs`, `epicId`.
- `src/commands/workflow-flags.ts`: Đăng ký cờ `--cwd <path>` và `--follow-up <task-id>`.
- `src/commands/workflow-command.ts`: Chuyển tiếp các cờ `--cwd` và `--follow-up` vào core handlers.
- `test/unit/utils/check-runner.test.ts`: Bổ sung kiểm thử đơn vị cho `cwd`.
- `test/unit/core/workflow/init.test.ts`: Bổ sung kiểm thử đơn vị cho `--follow-up`.
- `test/unit/core/workflow/run-check.test.ts`: Bổ sung kiểm thử đơn vị cho baseline run-check trong planning.

## 2. Kế hoạch triển khai theo Slices (RED → GREEN → REFACTOR)

### Slice 1: Multi-repo `cwd` trong CheckRunner & ValidationCheck (RED → GREEN)
- Viết test cho `checkRunner` khi có `cwd`: đảm bảo lệnh chạy đúng trong thư mục con được chỉ định.
- Cập nhật `src/core/tasks/task-schema.ts` thêm `cwd?: string` vào `ValidationCheck`.
- Cập nhật `src/utils/check-runner.ts` và `src/core/workflow/run-check.ts` xử lý `cwd`.
- Bổ sung cờ `--cwd` trong `workflow-flags.ts` và `workflow-command.ts`.

### Slice 2: Follow-up Task Lifecycle (`workflow --init --follow-up`) (RED → GREEN)
- Viết test trong `test/unit/core/workflow/init.test.ts`:
  - Khởi tạo task với `--follow-up <task-id>` kế thừa `relevantPaths`, `relevantSpecs`, `epicId`.
  - Kiểm tra từ chối nếu task-id không tồn tại hoặc chưa completed.
- Cập nhật `src/core/workflow/init.ts` và CLI options để hỗ trợ `--follow-up`.

### Slice 3: Baseline Check Verification trong Planning (RED → GREEN)
- Cập nhật `src/core/workflow/run-check.ts`: cho phép chạy khi active task ở trạng thái `planning` để xác lập baseline.
- Ghi nhận bằng chứng kết quả kiểm tra baseline vào task.
- Viết test kiểm tra hành vi này trong `test/unit/core/workflow/run-check.test.ts`.

### Slice 4: Verification, Suite Gate & Documentation (VERIFY)
- Chạy unit tests: `check-runner`, `init`, `run-check`.
- Chạy suite gate toàn diện.
- Cập nhật tài liệu: `CHANGELOG.md`, `README.md`, `HARNIX_WORKFLOW.md`, `AGENTS.md`.

## 3. Implementation Checklist
- [x] Slice 1: Multi-repo `cwd` trong CheckRunner & ValidationCheck schema.
- [x] Slice 2: Follow-up Task Initialization (`workflow --init --follow-up <task-id>`).
- [x] Slice 3: Baseline check execution trong planning stage.
- [x] Slice 4: Suite gate và hoàn thiện tài liệu hướng dẫn.
