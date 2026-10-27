# Plan - Batch State Mutation Envelope (`workflow --batch`)

## 1. Danh sách Files & Interfaces bị ảnh hưởng
- `src/core/workflow/batch.ts` (mới): Chứa hàm xử lý `batchWorkflow` và validation schema cho `WorkflowBatchEnvelope`.
- `src/core/workflow/index.ts`: Re-export `batchWorkflow` và các types liên quan.
- `src/core/workflow/brief.ts`: Bổ sung `batch` vào danh sách `BRIEF_ACTIONS`.
- `src/commands/workflow-flags.ts`: Đăng ký cờ `--batch` vào định nghĩa options của Commander.
- `src/commands/workflow-command.ts`: Bổ sung handler `batch` đọc JSON từ stdin và gọi `batchWorkflow`.
- `test/unit/core/workflow/batch.test.ts` (mới): Unit test kiểm tra đầy đủ các kịch bản của batch mutation.

## 2. Kế hoạch triển khai theo Slices (RED → GREEN → REFACTOR)

### Slice 1: Unit Test & Schema Validation (RED)
- Tạo tệp kiểm thử `test/unit/core/workflow/batch.test.ts`.
- Định nghĩa các test case cho `validateWorkflowBatchEnvelope`:
  - Chấp nhận envelope hợp lệ với criteria, checks, decisions, risks, paths.
  - Từ chối envelope không phải object hoặc chứa trường lạ.
  - Từ chối chuỗi chứa UTF-8 mojibake hoặc null byte.
- Định nghĩa test case thực thi `batchWorkflow`:
  - Cập nhật đồng thời criterion mới và check mới.
  - Ghi nhận decision và risk.
  - Ghi nhận relevant paths.

### Slice 2: Module Xử lý Core Batch Mutation (GREEN)
- Xây dựng module `src/core/workflow/batch.ts` (≤ 300 dòng code):
  - Định nghĩa interface `WorkflowBatchEnvelope`.
  - Hàm `validateWorkflowBatchEnvelope(input: unknown)`.
  - Hàm `batchWorkflow(root: string, envelope: unknown)`.
  - Acquire file lock duy nhất, tải active task, áp dụng tuần tự các thay đổi vào bản sao task clone, xác thực contract rules, và lưu atomic `task.json`.
- Export trong `src/core/workflow/index.ts`.

### Slice 3: CLI Flag Wiring & Brief Support (GREEN)
- Bổ sung `batch` vào `BRIEF_ACTIONS` trong `src/core/workflow/brief.ts`.
- Khai báo cờ `--batch` trong `src/commands/workflow-flags.ts`.
- Bổ sung handler `batch` vào `HANDLERS` trong `src/commands/workflow-command.ts`.
- Cập nhật `test/workflow/cli-contract.test.ts` và snapshot nếu cần.

### Slice 4: Verification & Suite Gate (VERIFY)
- Chạy unit tests: `pnpm vitest run test/unit/core/workflow/batch.test.ts`.
- Chạy integration tests: kiểm tra cờ CLI `workflow --batch` hoạt động thực tế qua pipe stdin.
- Chạy suite gate toàn diện: `pnpm vitest run test/workflow/`.

## 3. Implementation Checklist
- [x] Slice 1 (RED): Tạo `test/unit/core/workflow/batch.test.ts` với các test assertions cho batch envelope validation và mutation logic.
- [x] Slice 2 (GREEN): Xây dựng `src/core/workflow/batch.ts` hỗ trợ gộp criteria, checks, decisions, risks, paths dưới 1 lock duy nhất.
- [x] Slice 3 (GREEN): Đăng ký cờ `--batch` trong `workflow-flags.ts`, `workflow-command.ts` và `brief.ts`.
- [x] Slice 4 (VERIFY): Kiểm thử đơn vị, kiểm thử tích hợp CLI và suite gate pass 100%.
