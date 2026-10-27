# Epic: Tối ưu hóa môi trường Enterprise multi-repo .NET / TypeScript, gia cố Context Injection và độ tin cậy Workflow

Giải quyết triệt để 5 điểm nghẽn và friction points thực tế trên multi-repo .NET / TypeScript / Windows: (1) Khắc phục double testing trong verify-plan --recursive và hỗ trợ file .harnixignore loại trừ thư mục rác / tools; (2) Nâng cấp repo-map --tests quét symbol reference cho C# .NET, bổ sung quan hệ ProjectReference cho --impact và lọc nhiễu tham số trong --events; (3) Tối ưu hóa Token Hook sang Lean Context Injection tránh dump mã nguồn thô vào prompt; (4) Bổ sung cảnh báo taskSwitched trong workflow preflight khi active task bị chuyển ngầm và hoàn thiện cờ --file cho toàn bộ lệnh workflow.

- **Cập nhật:** 2026-10-23 14:51:41 +07:00

## Non-goals

- Không thay đổi TaskRecord schema v3 đóng băng
- Không hạ ngưỡng coverage tiêu chuẩn (>= 98.6% functions, >= 95% lines)
- Không tự động commit hay push Git mà không có lệnh người dùng

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261023-145051-verify-plan-deduplication-and-harnixignore` | Tối ưu hóa Verify Plan trên .NET và hỗ trợ cấu hình .harnixignore | `lite` | `completed` |
| 2 | `20261023-145100-csharp-repomap-tests-impact-and-events` | Nâng cấp Repo-Map cho C# .NET: Affected Tests qua Symbol, Project Impact và lọc Event Topic | `lite` | `completed` |
| 3 | `20261023-145111-lean-context-injection-and-token-optimization` | Tối ưu hóa Token Hook: Chuyển sang Lean Context Injection tránh tràn mã nguồn vào prompt | `lite` | `completed` |
| 4 | `20261023-145123-workflow-preflight-switch-detection-and-safe-stdin` | Cảnh báo chuyển Task ngầm trong Workflow Preflight và chuẩn hóa cờ --file | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261023-145051-verify-plan-deduplication-and-harnixignore` — Tối ưu hóa Verify Plan trên .NET và hỗ trợ cấu hình .harnixignore

- **Trạng thái:** `completed`
- **Mục tiêu:** Khắc phục hiện tượng chạy test trùng lặp (double testing) trong verify-plan --recursive khi solution cha đã chứa các project con, đồng thời bổ sung cơ chế đọc file cấu hình .harnixignore ở project root để loại trừ các thư mục rác / scratch script / công cụ nội bộ khỏi stack detection và verify plan.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261023-145100-csharp-repomap-tests-impact-and-events` — Nâng cấp Repo-Map cho C# .NET: Affected Tests qua Symbol, Project Impact và lọc Event Topic

- **Trạng thái:** `completed`
- **Mục tiêu:** Nâng cấp toàn diện bộ phân tích mã nguồn C# .NET trong repo-map: (1) repo-map --tests bổ sung quét symbol reference (tìm class name và interface trong test files) để phát hiện test đặt theo use case; (2) repo-map --impact liên kết file .cs với .csproj sở hữu để mở rộng graph dependencies; (3) repo-map --events lọc bỏ tham số nhiễu (stoppingToken, Arg.Any, payload) và hỗ trợ resolve constant class topic.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261023-145111-lean-context-injection-and-token-optimization` — Tối ưu hóa Token Hook: Chuyển sang Lean Context Injection tránh tràn mã nguồn vào prompt

- **Trạng thái:** `completed`
- **Mục tiêu:** Tái cấu trúc hook renderInternalContext sang Lean Context: mặc định chỉ chèn metadata và task structure tóm tắt (< 300 tokens) thay vì dump toàn bộ raw source code của tất cả các file trong relevantPaths; bổ sung tùy chọn contextMode: lean | full trong cấu hình.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261023-145123-workflow-preflight-switch-detection-and-safe-stdin` — Cảnh báo chuyển Task ngầm trong Workflow Preflight và chuẩn hóa cờ --file

- **Trạng thái:** `completed`
- **Mục tiêu:** Bổ sung cờ --expected-task trong workflow preflight để phát hiện và cảnh báo kịp thời khi active task bị chuyển đổi ngoài ý muốn trong cùng session; đồng thời chuẩn hóa hỗ trợ cờ --file cho toàn bộ các lệnh nhận payload JSON trong workflow-handlers.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
