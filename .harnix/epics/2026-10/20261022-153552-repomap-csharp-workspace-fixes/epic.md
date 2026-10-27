# Epic: Khắc phục triệt để các khiếm khuyết trong Repo-Map, C# Support, Meta-Workspace và UTF-8 Payload

Sửa các lỗi và bổ sung các capability còn thiếu: (1) Khắc phục False Positives của bộ lọc bảo mật trên file C#/TS nghiệp vụ và bổ sung default action cho repo-map; (2) Nâng cấp parser tĩnh cho C#/.NET bóc tách Kafka/CAP Topic và ProjectReference dependency graph; (3) Chuẩn hóa phân định Meta-Workspace/Multi-repo không có .git ở root và mở rộng hỗ trợ UTF-8 file payload.

- **Cập nhật:** 2026-10-22 15:35:52 +07:00

## Non-goals

- Không đưa thêm external daemon hoặc language server process vào Harnix
- Không phá vỡ format RepoMapRecordV1
- Không tự động commit hay push Git

## Next task

Không còn task nào chưa hoàn tất.

## Members (3 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261022-153613-repomap-secret-filter-and-default-action` | Sửa False Positives Secret Filter và Bổ sung Default Action cho Repo-Map | `lite` | `completed` |
| 2 | `20261022-160606-csharp-events-and-project-reference-graph` | Nâng cấp C#/.NET Parser cho Kafka Topics và ProjectReference Dependency Graph | `lite` | `completed` |
| 3 | `20261022-161419-meta-workspace-and-utf8-payload` | Chuẩn hóa Meta-Workspace Discovery và UTF-8 Payload Handoff | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261022-153613-repomap-secret-filter-and-default-action` — Sửa False Positives Secret Filter và Bổ sung Default Action cho Repo-Map

- **Trạng thái:** `completed`
- **Mục tiêu:** Sửa False Positives Secret Filter và Bổ sung Default Action cho Repo-Map
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261022-160606-csharp-events-and-project-reference-graph` — Nâng cấp C#/.NET Parser cho Kafka Topics và ProjectReference Dependency Graph

- **Trạng thái:** `completed`
- **Mục tiêu:** Nâng cấp C#/.NET Parser cho Kafka Topics và ProjectReference Dependency Graph
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 3. `20261022-161419-meta-workspace-and-utf8-payload` — Chuẩn hóa Meta-Workspace Discovery và UTF-8 Payload Handoff

- **Trạng thái:** `completed`
- **Mục tiêu:** Chuẩn hóa Meta-Workspace Discovery và UTF-8 Payload Handoff
- **Tiêu chí nghiệm thu:** 2 tiêu chí
