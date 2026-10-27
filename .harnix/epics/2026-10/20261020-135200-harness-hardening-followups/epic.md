# Epic: Xử lý các vấn đề tồn đọng và lỗi phát sinh khi chạy Harnix

Gom các việc đã ghi nhận mà chưa làm sau epic 2.13.0 và các vướng mắc gặp khi chạy Harnix: dashboard Code impact trong review.md chưa có producer, khe cmd.exe với tên lệnh trần không resolve được, doctor không cảnh báo config.yaml thiếu packages, thông báo cờ workflow gây hiểu nhầm và --task chưa dùng được cho --dry-run, cùng vài cứng hóa test và cổng.

- **Cập nhật:** 2026-10-20 13:52:00 +07:00

## Non-goals

- Không thêm lệnh public mới và không thêm điều phối subagent bắt buộc (harnix review-plan bị loại vì chạm ranh giới).
- Không tự ghi config.yaml của người dùng.
- Không chạy update --global hay chỉnh home thật.

## Next task

Không còn task nào chưa hoàn tất.

## Members (6 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261020-135201-review-code-impact-dashboard` | Sinh dashboard Code impact cho review.md từ Git chỉ đọc | `full` | `completed` |
| 2 | `20261020-135202-check-runner-unresolved-bare-name` | Tên lệnh trần không tìm thấy trên PATH không còn đi qua cmd.exe | `full` | `completed` |
| 3 | `20261020-135203-doctor-config-packages-drift` | doctor báo cấu hình packages trong config.yaml lệch so với phát hiện hiện tại | `full` | `completed` |
| 4 | `20261020-135204-workflow-cli-ergonomics` | Công thái học cờ workflow: thông báo thiếu id và --task cho --transition --dry-run | `lite` | `completed` |
| 5 | `20261020-135205-workspace-status-and-gate-hardening` | Củng cố status --workspace và các cổng: test ahead/behind git thật, measure:footprint báo thiếu dist, thông điệp test-structure | `lite` | `completed` |
| 6 | `20261020-135925-config-detection-refresh` | Phát hiện bỏ qua thư mục worktree của công cụ và để harnix update làm mới config.yaml | `full` | `completed` |

## Task Overview & Scope

### 1. `20261020-135201-review-code-impact-dashboard` — Sinh dashboard Code impact cho review.md từ Git chỉ đọc

- **Trạng thái:** `completed`
- **Mục tiêu:** Mục ## Code impact của review.md hiện có renderer nhưng không có nơi nào tính codeImpact; thêm bộ tính chỉ đọc từ Git (số dòng +/- và trạng thái từng file) để review.md của task đang làm hoặc đang verify hiển thị đúng.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261020-135202-check-runner-unresolved-bare-name` — Tên lệnh trần không tìm thấy trên PATH không còn đi qua cmd.exe

- **Trạng thái:** `completed`
- **Mục tiêu:** Đóng khe còn lại của check-runner trên Windows: tên lệnh trần mà PATH không resolve được không còn được giao cho cmd.exe (nơi tìm trong thư mục làm việc trước), trừ một danh sách cố định lệnh nội trang.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261020-135203-doctor-config-packages-drift` — doctor báo cấu hình packages trong config.yaml lệch so với phát hiện hiện tại

- **Trạng thái:** `completed`
- **Mục tiêu:** Cho người đã init từ trước thấy khi packages trong config.yaml thiếu so với thư mục package phát hiện được hiện tại: doctor thêm finding mức info, không ghi config và không đổi mã thoát.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261020-135204-workflow-cli-ergonomics` — Công thái học cờ workflow: thông báo thiếu id và --task cho --transition --dry-run

- **Trạng thái:** `completed`
- **Mục tiêu:** Hai điểm vướng khi dùng hidden workflow: (a) --add-decision, --add-risk hay --add-criterion thiếu id trả thông báo gây hiểu nhầm ('does not accept operands' hay 'requires --text and --rationale') thay vì nói cần id; (b) không kiểm được ready-gate của task member đang planning trong epic vì --transition --dry-run chưa nhận --task.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 5. `20261020-135205-workspace-status-and-gate-hardening` — Củng cố status --workspace và các cổng: test ahead/behind git thật, measure:footprint báo thiếu dist, thông điệp test-structure

- **Trạng thái:** `completed`
- **Mục tiêu:** Ba điểm cứng hóa nhỏ rút ra từ epic trước: test git thật cho ahead/behind của status --workspace (hiện chỉ phủ bằng parser), measure:footprint báo lỗi rõ khi thiếu dist/cli.js thay vì lỗi khó hiểu, và test-structure nêu quy tắc đặt file khi phát hiện file mồ côi.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 6. `20261020-135925-config-detection-refresh` — Phát hiện bỏ qua thư mục worktree của công cụ và để harnix update làm mới config.yaml

- **Trạng thái:** `completed`
- **Mục tiêu:** Trên payment-hub, config.yaml chỉ ghi 1 trong 9 package thật vì init chỉ phát hiện một lần và không lệnh nào làm mới; đồng thời phát hiện hiện tại còn lẫn các thư mục worktree của công cụ (.kilo/worktrees/*). Sửa danh sách bỏ qua dùng chung và cho harnix update (không thêm lệnh hay cờ mới) làm mới config.yaml theo kiểu chỉ thêm.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
