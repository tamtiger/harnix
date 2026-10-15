# Plan: Cải tiến CLI khởi tạo Epic, nạp file UTF-8, chuyển đổi task và DX

## 1. Mục tiêu và phạm vi
Triển khai 7 tiêu chí nghiệm thu (ac-1 đến ac-7) nhằm tối ưu hoá trải nghiệm người dùng (DX), loại bỏ lỗi hỏng font tiếng Việt qua stdin pipe bằng `--file`, phát hiện lossy encoding `???`, bổ sung các cờ hỗ trợ chuyển đổi task nhanh (`--force`, `--next`), tiện ích tiêu đề/mục tiêu (`--set-title`, `--set-goal`), in Markdown trực tiếp (`--raw`) và tinh chỉnh preflight/status context.

## 2. Kế hoạch triển khai chi tiết

- [x] 1. Hỗ trợ nạp cấu hình từ file (`--file <path>`) cho `workflow --save`, `--batch`, `--migrate` và `epic` (ac-1)
  - Viết test cho cờ `--file` đọc JSON/YAML UTF-8 trực tiếp từ đường dẫn tệp.
  - Triển khai flag `--file <path>` trong `src/commands/workflow-flags.ts`, `src/commands/workflow-handlers.ts`, `src/commands/epic.ts`.
- [x] 2. Phát hiện mất dấu tiếng Việt `???` trong `text-integrity.ts` (ac-2)
  - Viết unit test trong `test/workflow/text-integrity.test.ts` kiểm tra chuỗi bị lossy conversion (chứa `???` liền kề trong từ tiếng Việt hoặc chuỗi dấu hỏi thay cho ký tự UTF-8).
  - Triển khai hàm kiểm tra trong `src/core/workflow/text-integrity.ts`.
- [x] 3. Hỗ trợ cờ `--force` và `--next` cho `harnix resume` (ac-3)
  - Viết test cho `resume --force` (tự động pause task đang active) và `resume --next` (tự tìm task kế tiếp của epic).
  - Triển khai cập nhật trong `src/commands/resume.ts`.
- [x] 4. Bổ sung cờ `--set-title` và `--set-goal` cho `harnix workflow` (ac-4)
  - Viết test cho `workflow --set-title <text>` và `workflow --set-goal <text>`.
  - Triển khai flag và handler tương ứng trong `src/commands/workflow-flags.ts` và `src/commands/workflow-handlers.ts`.
- [x] 5. Cải tiến `harnix status` và `workflow --preflight` gợi ý `epicContext` và `nextTask` (ac-5)
  - Viết test cho preflight và status khi không có activeTask nhưng có epic chưa hoàn tất.
  - Cập nhật `src/core/workflow/preflight.ts` và `src/commands/status.ts`.
- [x] 6. Thêm cờ `--raw` cho `harnix skill` (ac-6)
  - Viết test cho `harnix skill <name> --raw`.
  - Cập nhật `src/commands/skills.ts` in trực tiếp nội dung Markdown khi có `--raw`.
- [x] 7. Đưa `.harnix/cache/` vào `.gitignore` mẫu và thông báo log khi cập nhật managed files (ac-7)
  - Cập nhật template `.gitignore` trong `src/templates/harnix/gitignore.ts` hoặc tương đương.
  - Kiểm tra và đảm bảo không phá vỡ kiến trúc kiến trúc (`test/workflow/architecture.test.ts`).
- [x] 8. Kiểm thử toàn diện và cập nhật phiên bản (ac-1..ac-7)
  - Chạy `test:gates` và `test`.
  - Bump phiên bản `2.7.0-dev.3`.
