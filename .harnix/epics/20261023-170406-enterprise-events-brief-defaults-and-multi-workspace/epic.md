# Epic: Đại tu Phân tích Sự kiện C# .NET, Mặc định Brief Mode, Kích hoạt Chủ động Technique Skills & Hỗ trợ Multi-Workspace Enterprise

Tích hợp toàn diện 2 đợt cải tiến: (1) Token economy & Windows UX (mặc định brief mode, cờ inline --note/--reason, tự động ép UTF-8 stdin win32); (2) AST C# Confluent.Kafka phân giải Options/Literal và truy vết Wrapper callers; (3) Multi-workspace root repo-map và linkedWorkspaces; (4) Reference chuyên đề dotnet-microservices.md và Active Skill Triggers bắt buộc nạp reference khi chạy subagent/multi-agent; (5) Contextual Technique Hints trong preflight, lệnh harnix skill --suggest, Actionable Error Suggestions và cảnh báo stale project-facts.

- **Cập nhật:** 2026-10-23 17:08:03 +07:00

## Non-goals

- Không thay đổi TaskRecord schema v3 đóng băng
- Không vi phạm quy tắc an toàn bảo mật và cô lập filesystem

## Next task

- `20261023-170407-workflow-brief-default-and-safe-inline-flags` — Mặc định Brief Mode cho Workflow Commands và Tự động ép UTF-8 trên Windows (`planning`)

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261023-170407-workflow-brief-default-and-safe-inline-flags` | Mặc định Brief Mode cho Workflow Commands và Tự động ép UTF-8 trên Windows | `lite` | `planning` |
| 2 | `20261023-170408-events-options-resolution-and-wrapper-tracing` | AST C# Constant/Options Resolution và cấu hình Producer Wrappers cho repo-map --events | `lite` | `planning` |
| 3 | `20261023-170409-multi-workspace-root-repo-map` | Hỗ trợ Multi-Workspace Root và liên kết cụm repository cho repo-map --events | `lite` | `planning` |
| 4 | `20261023-170410-dotnet-microservices-reference-and-active-triggers` | Bổ sung Reference dotnet-microservices và thiết lập Active Skill Triggers cho Multi-Agent | `lite` | `planning` |
| 5 | `20261023-170411-preflight-hints-skill-suggest-and-closing` | Contextual Technique Hints, lệnh skill --suggest, Actionable Error Messages, cảnh báo Stale Facts và đóng Epic | `lite` | `planning` |

## Task Overview & Scope

### 1. `20261023-170407-workflow-brief-default-and-safe-inline-flags` — Mặc định Brief Mode cho Workflow Commands và Tự động ép UTF-8 trên Windows

- **Trạng thái:** `planning`
- **Mục tiêu:** Đổi mặc định của toàn bộ các lệnh ghi workflow sang Brief Output (chỉ in id, status, checkpoint, updatedAt); thêm cờ --full khi cần in trọn vẹn JSON; hỗ trợ inline flags --note, --reason; và tự động ép UTF-8 cho stdin trên Windows win32.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261023-170408-events-options-resolution-and-wrapper-tracing` — AST C# Constant/Options Resolution và cấu hình Producer Wrappers cho repo-map --events

- **Trạng thái:** `planning`
- **Mục tiêu:** Phân tích AST C# bóc tách chuỗi thực tế từ constant/Options class; hỗ trợ cấu hình events.producerWrappers trong config.yaml; loại bỏ triệt để các biến rác dynamic (eto.EventName, splitTopics, dataKafka).
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261023-170409-multi-workspace-root-repo-map` — Hỗ trợ Multi-Workspace Root và liên kết cụm repository cho repo-map --events

- **Trạng thái:** `planning`
- **Mục tiêu:** Cho phép truyền nhiều path vào --workspace hoặc cấu hình linkedWorkspaces trong .harnix/config.yaml để tạo Cross-system Event Matrix E2E liền mạch.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261023-170410-dotnet-microservices-reference-and-active-triggers` — Bổ sung Reference dotnet-microservices và thiết lập Active Skill Triggers cho Multi-Agent

- **Trạng thái:** `planning`
- **Mục tiêu:** Soạn thảo reference chuyên đề dotnet-microservices.md; cập nhật các file SKILL.md thiết lập Active Triggers bắt buộc agent/subagent nạp reference chuyên sâu khi gặp điều kiện (đặc biệt khi dispatch subagent/multi-agent bắt buộc nạp epic.md/scouting-isolation.md).
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 5. `20261023-170411-preflight-hints-skill-suggest-and-closing` — Contextual Technique Hints, lệnh skill --suggest, Actionable Error Messages, cảnh báo Stale Facts và đóng Epic

- **Trạng thái:** `planning`
- **Mục tiêu:** Thêm suggestedTechniques vào workflow --preflight; bổ sung lệnh harnix skill --suggest; Actionable Error Suggestions; cảnh báo projectFactsStale: true; đồng bộ tài liệu, pnpm selfhost:sync và đóng Epic.
- **Tiêu chí nghiệm thu:** 5 tiêu chí
