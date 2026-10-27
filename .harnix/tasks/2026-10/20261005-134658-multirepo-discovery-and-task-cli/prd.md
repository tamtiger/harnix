# PRD - Task 4: Hỗ trợ Multi-repository Discovery trong verify-plan và CLI Tạo Task Tiện Dụng

## 1. Mục tiêu (Goal)
- Bổ sung khả năng phát hiện đệ quy (`--recursive`) cho lệnh `harnix verify-plan`, hỗ trợ phát hiện các repository con, các solution .NET (`.sln`, `.csproj`), package Node, Python, Go, Rust nằm trong cấu trúc multi-repo hoặc monorepo hỗn hợp.
- Bổ sung action `workflow --init` hỗ trợ khởi tạo nhanh một TaskRecord v3 hợp lệ mà không cần soạn thảo envelope JSON phức tạp qua shell, loại bỏ hoàn toàn các lỗi hash literal / duplicate keys trong PowerShell.

## 2. Phạm vi (Scope)
- **verify-plan --recursive**:
  - Thêm option `--recursive` vào lệnh `harnix verify-plan`.
  - Nâng cấp `workspace-detection.ts` để khi có `--recursive` (hoặc cấu hình tương đương), luôn thực hiện quét sâu qua các repository con (kể cả folder con có `.git`), phát hiện các tệp dự án .NET (`.sln`, `.csproj`, `.fsproj`), Node (`package.json`), Python (`pyproject.toml`, `requirements.txt`), Go (`go.mod`), Rust (`Cargo.toml`).
  - Hợp nhất và hiển thị các package kiểm thử của từng dự án con trong kết quả verify-plan.
- **workflow --init**:
  - Hỗ trợ cờ `--init` trong `harnix workflow` kết hợp với `--title <title>`, `--mode <lite|full>`, `--goal <goal>`, `--criterion <text>`, `--command <cmd>`, `--input <glob>`.
  - Tự động sinh Task ID chuẩn regex (`YYYYMMDD-HHMMSS-<slug>`), khởi tạo các cấu trúc bắt buộc của TaskRecord v3 (status `planning`, checkpoint `planning`, `acceptanceCriteria`, `validationPlan`, `evidence: []`).
  - Lưu và đặt active task ngay lập tức.
- Giữ vững toàn bộ các test suite hồi quy và golden snapshots.

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)
- **AC-1**: `verify-plan` hỗ trợ quét sâu các package/repository con lồng nhau qua `--recursive`, phát hiện cả solution .NET lẫn các hệ sinh thái khác.
- **AC-2**: Bổ sung action `workflow --init` hỗ trợ tạo task an toàn với các cờ cơ bản (`--title`, `--mode`, `--goal`, `--criterion`, `--command`, `--input`).
- **AC-3**: Toàn bộ test suite unit, workflow và acceptance của Harnix vượt qua 100% exit code 0.
