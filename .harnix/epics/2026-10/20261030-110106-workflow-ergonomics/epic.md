# Epic: Giảm task trùng lặp và lỗi flag khó đoán trong workflow

Xử lý các vấn đề còn lại từ phản hồi sử dụng thực tế: task phình to và trùng lặp, thông báo lỗi flag không có ví dụ chạy được, plan.md lệch với criterion, slug tiếng Việt, và các tiện ích dọn dẹp, tiết kiệm token.

- **Cập nhật:** 2026-10-30 11:23:54 +07:00

## Non-goals

- Không thêm lệnh merge task hay file khai báo repos[] đa repo (đã có tìm .harnix ở thư mục cha, --cwd và --task).
- Không thêm cờ --shell; check vẫn là executable cộng mảng đối số.
- Không nới lỏng tính bất biến của check đã có evidence.

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261030-110107-task-sprawl-guard` | Cảnh báo task gần giống khi tạo task mới | `lite` | `completed` |
| 2 | `20261030-110109-token-and-check-ergonomics` | Liệt kê task gọn, task treo và hint secretAdvisory | `lite` | `completed` |
| 3 | `20261030-112342-cancel-single-task` | Hủy một task không active bằng --task | `lite` | `completed` |
| 4 | `20261030-110108-actionable-flag-errors` | Thông báo lỗi flag có ví dụ chạy được và notice plan.md | `lite` | `completed` |
| 5 | `20261030-111311-doctor-task-preflight` | Doctor cảnh báo sớm check thiếu cwd, plan.md lệch và task trùng | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261030-110107-task-sprawl-guard` — Cảnh báo task gần giống khi tạo task mới

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi tạo task mới, cảnh báo nếu title hoặc goal gần giống task đang mở hoặc đã hoàn thành, qua một helper dùng chung để doctor tái dùng.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 2. `20261030-110109-token-and-check-ergonomics` — Liệt kê task gọn, task treo và hint secretAdvisory

- **Trạng thái:** `completed`
- **Mục tiêu:** Rà soát nhiều task ít token: tasks --brief phát JSON rút gọn, tasks --stale liệt kê task treo; secretAdvisory của --finish có hint ignore.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261030-112342-cancel-single-task` — Hủy một task không active bằng --task

- **Trạng thái:** `completed`
- **Mục tiêu:** workflow --cancel nhận --task <id> để hủy task unfinished không active mà không cần resume, giữ nguyên yêu cầu authorizedBy user.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 4. `20261030-110108-actionable-flag-errors` — Thông báo lỗi flag có ví dụ chạy được và notice plan.md

- **Trạng thái:** `completed`
- **Mục tiêu:** Mọi lỗi về --reason, field lạ trong batch và --slug đều in lệnh sửa chạy được; thêm criterion tự đồng bộ dòng trong plan.md; slug tiếng Việt được bỏ dấu tự động.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 5. `20261030-111311-doctor-task-preflight` — Doctor cảnh báo sớm check thiếu cwd, plan.md lệch và task trùng

- **Trạng thái:** `completed`
- **Mục tiêu:** harnix doctor báo mức warning các lỗi cấu hình task mà hiện chỉ lộ ra ở ready gate hoặc lúc chạy check.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
