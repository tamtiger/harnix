# Epic: Sửa các điểm yếu rút ra từ review upstream

Xử lý bốn lỗi hành vi mà review đã chỉ ra ở các commit upstream: thứ tự check theo thời lượng, input mặc định thiếu file cấu hình, check-lint nhận nhầm cờ ghi file và chuẩn hóa cwd của lệnh suite.

- **Cập nhật:** 2026-11-16 13:53:51 +07:00

## Non-goals

- Không đổi ranh giới link của platform root và hành vi uninstall; hai việc đó cần quyết định riêng.

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261116-135352-check-order-pass-only` | Thứ tự check chỉ dựa trên thời lượng của lần chạy pass | `lite` | `completed` |
| 2 | `20261116-135353-default-inputs-config-files` | Input mặc định của check suite gồm các file cấu hình gốc | `lite` | `completed` |
| 3 | `20261116-135354-lint-check-write-flags` | Check-lint chỉ đọc nhận diện cờ ghi file viết tắt | `lite` | `completed` |
| 4 | `20261116-135355-suite-cwd-normalize` | Chuẩn hóa cwd khi so khớp lệnh suite với package | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261116-135352-check-order-pass-only` — Thứ tự check chỉ dựa trên thời lượng của lần chạy pass

- **Trạng thái:** `completed`
- **Mục tiêu:** Thời lượng dùng để xếp check rẻ trước chỉ lấy từ lần chạy pass, và durationMs trong task.json phải là số nguyên không âm trong giới hạn hợp lý.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261116-135353-default-inputs-config-files` — Input mặc định của check suite gồm các file cấu hình gốc

- **Trạng thái:** `completed`
- **Mục tiêu:** Input mặc định đã thu hẹp của check suite và check-lint phải đổi digest khi sửa file cấu hình test, lint, lockfile hoặc solution ở thư mục gốc.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 3. `20261116-135354-lint-check-write-flags` — Check-lint chỉ đọc nhận diện cờ ghi file viết tắt

- **Trạng thái:** `completed`
- **Mục tiêu:** Lệnh lint có cờ ghi file như -w hoặc --fix nằm trong script được nối không được khai báo thành check-lint chỉ đọc.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 4. `20261116-135355-suite-cwd-normalize` — Chuẩn hóa cwd khi so khớp lệnh suite với package

- **Trạng thái:** `completed`
- **Mục tiêu:** cwd của check suite dạng ./ hoặc pkg/. được chuẩn hóa trước khi so với đường dẫn package và so với '.', để lệnh test hợp lệ không bị từ chối.
- **Tiêu chí nghiệm thu:** 2 tiêu chí
