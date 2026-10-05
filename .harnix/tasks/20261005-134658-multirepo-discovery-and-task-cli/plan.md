# Kế hoạch thực hiện (Plan) - Task 4: Multi-repo Discovery & Task CLI

## Danh sách công việc (Checklist)
- [x] Slice 1: Nâng cấp `workspace-detection.ts` hỗ trợ phát hiện solution/project .NET (`.sln`, `.csproj`), Python và tùy chọn `recursive: true` quét xuyên suốt các thư mục con đa repo.
- [x] Slice 2: Bổ sung option `--recursive` cho lệnh CLI `harnix verify-plan` và truyền vào `buildVerifyPlan`.
- [x] Slice 3: Hiện thực action `workflow --init` trong `src/core/workflow/` cho phép khởi tạo nhanh TaskRecord v3 chuẩn chỉnh bằng các cờ CLI (`--title`, `--mode`, `--goal`, `--criterion`, `--command`, `--input`).
- [x] Slice 4: Tích hợp action `init` vào `workflow-flags.ts`, `workflow-command.ts`, `brief.ts`, `schema.ts`.
- [x] Slice 5: Viết unit tests TDD cho `verify-plan --recursive` và `workflow --init`.
- [x] Slice 6: Cập nhật CHANGELOG.md và chạy toàn bộ kiểm thử xác thực bảo đảm 100% exit code 0.

---

## Chi tiết các lát cắt thực hiện

### Slice 1 & 2: Multi-repo & Recursive Discovery
- Cập nhật `src/core/stack/workspace-detection.ts`:
  - Trong `discoverNestedManifests`: nhận diện thêm `.sln`, `.csproj`, `.fsproj`, `pyproject.toml`.
  - Cho phép quét các thư mục con kể cả khi ở root đã có workspace pnpm/npm nếu `recursive === true`.
  - Không bỏ qua thư mục con chỉ vì nó có `.git` (bỏ qua `.git` metadata directory nhưng quét nội dung repo con).
- Cập nhật `src/core/stack/verify-plan.ts` và `src/cli-workflow-commands.ts` hỗ trợ `--recursive`.

### Slice 3 & 4: Ergonomic Task Init CLI
- Xây dựng hàm `initTaskWorkflow(root, options)` trong `src/core/workflow/init-task.ts`:
  - Sinh ID theo format chuẩn `YYYYMMDD-HHMMSS-<slug>`.
  - Thiết lập TaskRecord v3 với mode lite/full, acceptance criteria, và validation check cơ bản.
  - Gọi `saveWorkflow` và `setActiveTask`.
- Tích hợp cờ `--init` vào hệ thống workflow flags và options của CLI.

### Slice 5 & 6: Testing & Verification
- Unit test trong `test/unit/core/stack/workspace-detection.test.ts` và `test/unit/core/workflow/init-task.test.ts`.
- Cập nhật `CHANGELOG.md` cho Task 4.
- Chạy toàn bộ verify checks và suite acceptance tests.
