# Epic: Củng cố Harnix theo phản hồi của agent

Xử lý các điểm yếu đã xác nhận từ phản hồi của Kiro và Claude: hook không bắt PowerShell, --tick lệch số, suite 0 test vẫn pass, --init thiếu tiện ích và các lỗi độ bền nhỏ.

- **Cập nhật:** 2026-11-13 16:53:07 +07:00

## Non-goals

- Không thay đổi schema bằng chứng theo mức độ.
- Không can thiệp quy tắc RAI cá nhân ngoài sản phẩm Harnix.

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261113-165308-hook-powershell-coverage` | Hook nhắc repo-map bắt cả tool PowerShell | `lite` | `completed` |
| 2 | `20261113-165309-plan-tick-stable-id` | Lệnh --tick chọn mục plan theo id ổn định | `lite` | `completed` |
| 3 | `20261113-165310-suite-zero-tests-guard` | Check suite chạy 0 test không được tính là pass | `lite` | `completed` |
| 4 | `20261113-165311-init-ergonomics` | Cải thiện công thái học của workflow --init | `lite` | `completed` |
| 5 | `20261113-165312-robustness-batch` | Gom các lỗi độ bền nhỏ của CLI và hook | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261113-165308-hook-powershell-coverage` — Hook nhắc repo-map bắt cả tool PowerShell

- **Trạng thái:** `completed`
- **Mục tiêu:** Hook PreToolUse nhắc dùng repo-map cũng chạy cho tool PowerShell và nhận diện Select-String, để agent trên Windows không bỏ sót lời nhắc.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261113-165309-plan-tick-stable-id` — Lệnh --tick chọn mục plan theo id ổn định

- **Trạng thái:** `completed`
- **Mục tiêu:** --tick chọn mục checklist theo id check hoặc slice khớp chính xác, in tên mục sẽ tick và hỗ trợ --brief, để thứ tự không bị lệch sau mỗi lần tick.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 3. `20261113-165310-suite-zero-tests-guard` — Check suite chạy 0 test không được tính là pass

- **Trạng thái:** `completed`
- **Mục tiêu:** Phát hiện đầu ra không có test nào chạy (dotnet, vitest, jest, pytest) và không ghi nhận đó là một lần pass đáng tin; cảnh báo ở cổng ready khi lệnh suite trỏ vào solution không có project test.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 4. `20261113-165311-init-ergonomics` — Cải thiện công thái học của workflow --init

- **Trạng thái:** `completed`
- **Mục tiêu:** --init in thư mục task, nạp prd.md và plan.md từ file ngay lúc khởi tạo, và lỗi cờ lặp có hint nêu dạng danh sách đúng.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 5. `20261113-165312-robustness-batch` — Gom các lỗi độ bền nhỏ của CLI và hook

- **Trạng thái:** `completed`
- **Mục tiêu:** Sửa các lỗi nhỏ đã repro: đường dẫn tương đối bị che trong lệnh, repo-map --refs với mã số, coveredBy sau replace-check, hook lấy nhầm task repo khác và lộ secret khi xem diff cấu hình.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
