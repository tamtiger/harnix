# Epic: Cải tiến harnix repo-map theo thực tế sử dụng

Làm repo-map đáng tin và gọn hơn grep ở các nhu cầu agent thật sự có trên các repo người dùng hay làm việc (his PHP, payment_hub C# và TypeScript): trích xuất đúng symbol và quan hệ, chạy đúng test hẹp, tìm file theo truy vấn mà không bị task đang active làm lệch, đọc thân symbol thay vì sed -n lặp lại, output gọn, và cơ chế để agent chủ động dùng; không thêm dependency và không để hook gọi repo-map.

- **Cập nhật:** 2026-11-09 20:49:22 +07:00

## Non-goals

- Không làm --cycles, --hubs, --budget, --unused: không có nhu cầu trong các session đã đọc.
- Không thêm tree-sitter hoặc call graph.
- Không thêm daemon, watcher, DB, MCP, embedding hay telemetry.
- Không đổi đường dẫn cache và schemaVersion 1 của RepoMapV1; chỉ thêm trường tùy chọn và nâng extractorVersion lên 2 (member repo-map-extractor-quality).

## Next task

Không còn task nào chưa hoàn tất.

## Members (6 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261109-203650-repo-map-extractor-quality` | Nâng chất lượng trích xuất repo-map (extractorVersion 2) cho PHP, C# và symbol lớn | `full` | `completed` |
| 2 | `20261109-200111-repo-map-tests-ranking` | Sửa thứ hạng repo-map --tests để test trực tiếp luôn đứng đầu | `full` | `completed` |
| 3 | `20261109-200112-repo-map-query-relevance` | Sửa độ liên quan của repo-map --query khi có task đang active | `full` | `completed` |
| 4 | `20261109-200113-repo-map-symbol-body` | Thêm repo-map --outline --symbol --body để đọc thân symbol | `full` | `completed` |
| 5 | `20261109-200114-repo-map-compact-refresh-changed` | Rút gọn output repo-map, giới hạn --refresh và kích hoạt agent dùng repo-map | `full` | `completed` |
| 6 | `20261110-001154-body-redaction-hardening` | Tăng cường che secret của repo-map --body | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261109-203650-repo-map-extractor-quality` — Nâng chất lượng trích xuất repo-map (extractorVersion 2) cho PHP, C# và symbol lớn

- **Trạng thái:** `completed`
- **Mục tiêu:** Sửa nền tảng mà mọi truy vấn repo-map dựa vào: chỉ mục symbol không còn bị cắt theo bảng chữ cái và có thuộc tính C#, import PHP và CodeIgniter được nhận đúng, đồ thị C# nối file với file khai báo kiểu thay vì với .csproj; nâng extractorVersion lên 2 với cơ chế coi cache cũ là stale.
- **Tiêu chí nghiệm thu:** 12 tiêu chí

### 2. `20261109-200111-repo-map-tests-ranking` — Sửa thứ hạng repo-map --tests để test trực tiếp luôn đứng đầu

- **Trạng thái:** `completed`
- **Mục tiêu:** Khiến harnix repo-map --tests <path> trả test liên quan nhất trước, để agent chạy đúng test hẹp thay vì quay về ls và grep.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261109-200112-repo-map-query-relevance` — Sửa độ liên quan của repo-map --query khi có task đang active

- **Trạng thái:** `completed`
- **Mục tiêu:** Khiến --query xếp theo chuỗi truy vấn thay vì bị file và từ khóa của task đang active lấn át, và tìm được file theo từ trong tên file.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261109-200113-repo-map-symbol-body` — Thêm repo-map --outline --symbol --body để đọc thân symbol

- **Trạng thái:** `completed`
- **Mục tiêu:** Cho agent đọc đúng thân một symbol (có giới hạn dòng) thay vì lặp lại sed -n trên các file lớn.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 5. `20261109-200114-repo-map-compact-refresh-changed` — Rút gọn output repo-map, giới hạn --refresh và kích hoạt agent dùng repo-map

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm output repo-map gọn hơn grep ở mọi chế độ, chặn output --refresh phình, và tạo cơ chế để agent chủ động dùng repo-map (chỉ thị trong skill, một dòng trong khối AGENTS, một dòng gợi ý tĩnh trong hook context); đóng epic bằng bản phát hành 2.31.0. Không làm --changed vì verify-plan --impact đã có.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 6. `20261110-001154-body-redaction-hardening` — Tăng cường che secret của repo-map --body

- **Trạng thái:** `completed`
- **Mục tiêu:** Che thêm các dạng secret còn lọt trong thân symbol của --body: YAML không dấu nháy, giá trị trong dấu nháy ngược, và token theo tiền tố nhà cung cấp.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

## Supporting Artifacts

- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.
