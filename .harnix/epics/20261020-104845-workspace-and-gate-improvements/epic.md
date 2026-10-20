# Epic: Cải thiện workspace đa repo, cổng nghiệm thu và độ nhất quán của CLI Harnix

Xử lý các vấn đề rút ra từ lần dùng Harnix 2.12.3 trên workspace đa repo thực tế (Payment Hub, Long Châu) và từ cổng nghiệm thu: sửa cổng measure:footprint đang đỏ từ trước, để repo-map --workspace dùng cache của workspace root thay vì báo missing và không tạo .harnix rác trong sub-repo, thêm lựa chọn cho doctor không fail khi chỉ có cảnh báo, khóa bằng test việc mã thoát process luôn khớp error.exitCode, và thêm bảng trạng thái Git chỉ đọc cho các sub-repo.

- **Cập nhật:** 2026-10-20 10:48:45 +07:00

## Non-goals

- Không thêm lệnh ghi Git như repo pull, repo sync, fetch hay checkout: trái ranh giới không tích hợp Git tự động và không mạng im lặng của Harnix.
- Không đổi mặc định của doctor: exit 1 khi có cảnh báo là hợp đồng đóng băng, chỉ thêm cờ opt-in.
- Không đổi schema TaskRecord v3, EpicRecord v1 hay doctor JSON v2.
- Không thêm package, daemon hay dịch vụ nền.

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261020-104846-fix-measure-footprint-gate` | Sửa cổng measure:footprint đang đỏ do giả định readiness sai | `lite` | `completed` |
| 2 | `20261020-104847-repo-map-workspace-root-cache` | repo-map --workspace dùng cache của workspace root và không tạo .harnix rác | `full` | `completed` |
| 3 | `20261020-104848-doctor-allow-warnings` | Thêm --allow-warnings cho doctor để pipeline không fail khi chỉ có cảnh báo | `full` | `completed` |
| 4 | `20261020-104849-exit-code-parity-guard` | Khóa bằng test việc mã thoát process luôn khớp error.exitCode của JSON | `lite` | `completed` |
| 5 | `20261020-104850-workspace-git-status-readonly` | Thêm harnix status --workspace: bảng trạng thái Git chỉ đọc của các sub-repo | `full` | `completed` |

## Task Overview & Scope

### 1. `20261020-104846-fix-measure-footprint-gate` — Sửa cổng measure:footprint đang đỏ do giả định readiness sai

- **Trạng thái:** `completed`
- **Mục tiêu:** Để scripts/measure-footprint.mjs không tự suy ra trạng thái cần xử lý từ readiness khác installed mà dựa vào chính hợp đồng của setup (exit 1 khi và chỉ khi có nội dung trên stderr), nên cổng không còn đỏ với Codex ở installed-pending-trust.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261020-104847-repo-map-workspace-root-cache` — repo-map --workspace dùng cache của workspace root và không tạo .harnix rác

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi sub-repo chưa có cache riêng nhưng workspace root đã có repo-map-v1.json (do repo-map --refresh ở root), truy vấn --workspace đọc từ cache root theo tiền tố thư mục thay vì báo missing; đồng thời refresh --workspace không tạo thư mục .harnix mới trong sub-repo chưa init.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261020-104848-doctor-allow-warnings` — Thêm --allow-warnings cho doctor để pipeline không fail khi chỉ có cảnh báo

- **Trạng thái:** `completed`
- **Mục tiêu:** Cho phép harnix doctor --allow-warnings thoát 0 khi summary.errors bằng 0 dù có cảnh báo, giữ nguyên mặc định (exit 1 khi có cảnh báo, exit 2 khi trạng thái invalid) vì đó là hợp đồng đóng băng.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261020-104849-exit-code-parity-guard` — Khóa bằng test việc mã thoát process luôn khớp error.exitCode của JSON

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm test hợp đồng bảo đảm với mọi lệnh public lỗi, giá trị trả về của runCli (mã thoát process) bằng error.exitCode trong JSON, và kết luận trung thực về báo cáo exit 1 so với JSON 2 của repo-map.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 5. `20261020-104850-workspace-git-status-readonly` — Thêm harnix status --workspace: bảng trạng thái Git chỉ đọc của các sub-repo

- **Trạng thái:** `completed`
- **Mục tiêu:** Cho phép harnix status --workspace [path] liệt kê các sub-repo có .git với nhánh hiện tại, tình trạng thay đổi và số commit ahead/behind so với upstream đã biết cục bộ, chỉ đọc và không dùng mạng, để người dùng đa repo khỏi chạy git thủ công nhiều lần.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
