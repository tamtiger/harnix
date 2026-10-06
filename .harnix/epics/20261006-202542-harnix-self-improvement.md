# Epic: Harnix tự cải tiến: tối ưu token và giảm ma sát phát hiện khi phát triển

Gom các cải tiến phát hiện trong lúc phát triển Harnix: gom bản dev thành bản phát hành, chạy mọi check bằng một lệnh, tóm tắt lỗi check gọn, giảm output lặp và giảm token của hook context. Mỗi member dùng bản dev của dòng phát hành kế tiếp; member cuối theo ID đóng epic bằng một bản minor.

- **Cập nhật:** 2026-10-06 20:25:42 +07:00

## Non-goals

- Không thêm dịch vụ, telemetry hay mạng
- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Next task

- `20261006-202543-version-sync-fold-dev` — version:sync gom các bản dev thành một entry phát hành (`planning`)

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261006-202543-version-sync-fold-dev` | version:sync gom các bản dev thành một entry phát hành | `full` | `planning` |
| 2 | `20261006-202544-run-all-checks` | Một lệnh chạy mọi check bắt buộc và tóm tắt kết quả | `full` | `planning` |
| 3 | `20261006-202545-run-check-failure-summary` | Output --run-check chỉ nêu test lỗi thay vì đuôi log dài | `full` | `planning` |
| 4 | `20261006-202546-quiet-advisories` | Giảm output dài của ready dry-run, finish và các gợi ý lặp | `full` | `planning` |
| 5 | `20261006-202547-hook-context-diet` | Hook context chỉ mang learning khi agent sắp lập kế hoạch | `full` | `planning` |

## Task Overview & Scope

### 1. `20261006-202543-version-sync-fold-dev` — version:sync gom các bản dev thành một entry phát hành

- **Trạng thái:** `planning`
- **Mục tiêu:** Khi đóng epic, pnpm version:sync X.Y.0 gom các entry X.Y.0-dev.N trong CHANGELOG thành một entry X.Y.0 thay vì để người làm gom tay, và không định dạng lại các file markdown không liên quan.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261006-202544-run-all-checks` — Một lệnh chạy mọi check bắt buộc và tóm tắt kết quả

- **Trạng thái:** `planning`
- **Mục tiêu:** Agent không phải gọi --run-check lần lượt cho từng check: một lệnh chạy các check bắt buộc còn pending hoặc stale theo thứ tự (focused trước, suite cuối), ghi evidence như --run-check, dừng ở lần fail đầu và in tóm tắt rất ngắn.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261006-202545-run-check-failure-summary` — Output --run-check chỉ nêu test lỗi thay vì đuôi log dài

- **Trạng thái:** `planning`
- **Mục tiêu:** Khi một check fail, outputTail của --run-check hiện tối đa 2000 ký tự log thô; thay bằng tóm tắt các test lỗi (tên và dòng đầu thông điệp) khi nhận diện được định dạng vitest, và giữ đuôi ngắn cho lệnh khác, để giảm token đọc lỗi.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261006-202546-quiet-advisories` — Giảm output dài của ready dry-run, finish và các gợi ý lặp

- **Trạng thái:** `planning`
- **Mục tiêu:** Các thông báo dài lặp lại ở mỗi lần gọi (advisory chưa baseline từng check trong ready dry-run, hint learning ở --finish) tốn token mà không đổi quyết định; gộp chúng thành một dòng ngắn có số lượng.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 5. `20261006-202547-hook-context-diet` — Hook context chỉ mang learning khi agent sắp lập kế hoạch

- **Trạng thái:** `planning`
- **Mục tiêu:** Hook UserPromptSubmit gắn 5 note learning vào mọi prompt dù task đang implement hay verify; chỉ gắn khi chưa có task active hoặc task đang planning, để giảm token mỗi lượt mà không mất thông tin lúc cần.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
