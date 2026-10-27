# Epic: Chia thư mục task và epic theo tháng, lưu trữ sau 30 ngày và migration

Thay thư mục phẳng .harnix/tasks/<id> và .harnix/epics/<id> bằng bố cục chia theo tháng cộng kho lưu trữ chỉ-đọc _archive cho task và epic đã kết thúc quá 30 ngày, có migration idempotent từ bố cục phẳng, để việc quét không còn tăng tuyến tính theo toàn bộ lịch sử mà không mất dữ liệu hay đổi hợp đồng task.

- **Cập nhật:** 2026-10-27 10:29:47 +07:00

## Non-goals

- Không đổi schema TaskRecord, ID task, ID epic, enum trạng thái hay giao thức hook
- Không lồng task vào thư mục epic (đường dẫn sẽ không suy ra được từ ID)
- Không tự động commit, xóa hay ghi lại nội dung task; archive chỉ chuyển thư mục
- Không thêm service, telemetry hay truy cập mạng thầm lặng

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261027-102135-task-location-resolver` | Resolver vị trí task và epic duy nhất, ghi mới vào bucket theo tháng | `full` | `completed` |
| 2 | `20261027-102136-task-scan-and-archived-views` | Quét task sống, xem task đã lưu trữ và epic qua nhiều bố cục | `full` | `completed` |
| 3 | `20261027-102137-task-layout-migration` | Migration task và epic từ bố cục phẳng sang bucket theo tháng | `full` | `completed` |
| 4 | `20261027-102138-task-archive-after-30-days` | Lệnh harnix archive chuyển task và epic đã kết thúc quá 30 ngày vào kho lưu trữ | `full` | `completed` |

## Task Overview & Scope

### 1. `20261027-102135-task-location-resolver` — Resolver vị trí task và epic duy nhất, ghi mới vào bucket theo tháng

- **Trạng thái:** `completed`
- **Mục tiêu:** Tạo một module duy nhất quyết định vị trí vật lý của task và epic (bucket tháng, bố cục phẳng cũ, kho lưu trữ), chuyển toàn bộ nơi đang dựng đường dẫn tasks/<id> và epics/<id> sang module đó và ghi mới vào bucket tháng, vẫn đọc được mọi bố cục.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261027-102136-task-scan-and-archived-views` — Quét task sống, xem task đã lưu trữ và epic qua nhiều bố cục

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm harnix tasks, harnix epic, status, doctor, baseline-hint, learning và resume chỉ quét phần task và epic sống theo mặc định, có cờ để xem kho lưu trữ, và để epic gom thành viên từ cả bucket lẫn _archive mà chỉ quét các tháng từ tháng của epic trở đi.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261027-102137-task-layout-migration` — Migration task và epic từ bố cục phẳng sang bucket theo tháng

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm migration idempotent chuyển .harnix/tasks/<id> và .harnix/epics/<id> sang bucket tháng qua harnix update và harnix doctor --fix, bằng rename nguyên tử dưới khóa workflow, có dry-run, không mất dữ liệu và không đổi nội dung; chạy sau migration roadmaps cũ.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261027-102138-task-archive-after-30-days` — Lệnh harnix archive chuyển task và epic đã kết thúc quá 30 ngày vào kho lưu trữ

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm lệnh công khai harnix archive (mặc định dry-run, --apply mới ghi, --days mặc định 30, --restore <id>) chuyển task completed hoặc cancelled và epic đã hoàn tất quá hạn vào _archive bằng rename; epic hoàn tất được lưu trữ cùng toàn bộ thành viên; kho chỉ đọc; đóng epic bằng bản phát hành minor 2.23.0.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

## Supporting Artifacts

- [`spec.md`](./spec.md) — Đặc tả thiết kế miền & hợp đồng kiến trúc.
