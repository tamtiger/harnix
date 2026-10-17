# Epic: Đại tu DX và Hỗ trợ Cụm Dự án Microservices (Không dùng MCP)

Nâng cấp Harnix 2.8.0 hỗ trợ đa repo workspace và định dạng gọn (compact output) cho repo-map, tối ưu hóa workflow batching loại bỏ ma sát encoding Windows, kiểm thử thông minh dựa trên độ ảnh hưởng (impact-driven verify-plan) và tìm kiếm ký ức theo ngữ nghĩa (BM25 memory).

- **Cập nhật:** 2026-10-16 11:34:56 +07:00

## Non-goals

- Không tạo Native MCP Server daemon chạy ngầm, không tạo tool definitions phình context window.
- Không tích hợp vector database hay thư viện embedding nhị phân làm phình kích thước package.
- Không phá vỡ tính cô lập của TaskRecord qua nhiều repo; dùng Workspace Epic để điều phối multi-repo.

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261016-113457-repo-map-compact-format` | Hỗ trợ định dạng Compact và Outline cho harnix repo-map query | `lite` | `completed` |
| 2 | `20261016-113458-repo-map-workspace-multirepo` | Hỗ trợ Workspace đa repository cho harnix repo-map | `lite` | `completed` |
| 3 | `20261016-113459-workflow-batching-and-shortcuts` | Tự động hóa và giảm boilerplate với Workflow Action Batching | `lite` | `completed` |
| 4 | `20261016-113500-impact-driven-verification` | Kiểm thử thông minh theo độ ảnh hưởng với verify-plan --impact | `lite` | `completed` |
| 5 | `20261016-113501-bm25-smart-memory-and-autodraft` | Nâng cấp tìm kiếm ký ức BM25 và tự động nháp Learning sau Bugfix | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261016-113457-repo-map-compact-format` — Hỗ trợ định dạng Compact và Outline cho harnix repo-map query

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm cờ --format <json|compact|outline> vào repo-map --query giúp cắt giảm 70% token context cho LLM.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 2. `20261016-113458-repo-map-workspace-multirepo` — Hỗ trợ Workspace đa repository cho harnix repo-map

- **Trạng thái:** `completed`
- **Mục tiêu:** Hỗ trợ cờ --workspace lập chỉ mục và truy vấn liên repo cho các cụm microservices (như payment-hub và payment-lc).
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 3. `20261016-113459-workflow-batching-and-shortcuts` — Tự động hóa và giảm boilerplate với Workflow Action Batching

- **Trạng thái:** `completed`
- **Mục tiêu:** Hỗ trợ gộp các thao tác workflow thường dùng giảm round-trip của LLM và tối ưu trải nghiệm Windows CLI.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261016-113500-impact-driven-verification` — Kiểm thử thông minh theo độ ảnh hưởng với verify-plan --impact

- **Trạng thái:** `completed`
- **Mục tiêu:** Tích hợp repo-map --impact vào verify-plan để tự động chạy tập test hẹp bị ảnh hưởng trong chu kỳ implement.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 5. `20261016-113501-bm25-smart-memory-and-autodraft` — Nâng cấp tìm kiếm ký ức BM25 và tự động nháp Learning sau Bugfix

- **Trạng thái:** `completed`
- **Mục tiêu:** Thay thế so khớp thô sơ trong harnix mem bằng BM25 ranking không dependency, tự động nháp learning sau khi finish bugfix task và đóng Epic phát hành v2.8.0.
- **Tiêu chí nghiệm thu:** 1 tiêu chí
