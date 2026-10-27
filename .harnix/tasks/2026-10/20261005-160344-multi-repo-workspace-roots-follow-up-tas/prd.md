# PRD - Multi-repo Workspace Roots, Follow-up Task Lifecycle & Baseline Checks

## 1. Bối cảnh & Vấn đề

Trong quá trình sử dụng thực tế của Harnix trên các dự án phức tạp, có 3 vấn đề lớn xuất hiện:
1. **Multi-repo Workspace & Working Directory (`cwd`)**:
   - Khi workspace chứa nhiều Git repositories con (ví dụ: `frt-payment-core`, `frt-payment-gateway`, `frt-payment-portal-web`), mỗi repository có tiến trình build/test riêng.
   - Hiện tại, lệnh chạy qua `workflow --run-check` mặc định chạy ở root project. Agent phải tự workaround bằng các lệnh chuỗi phức tạp kiểu `cmd.exe /d /c "cd /d <sub-repo> && npm test"`.
   - Cần bổ sung thuộc tính `cwd?: string` vào `ValidationCheck` để Harnix tự động điều hướng working directory an toàn đến repo con khi chạy check.
2. **Task Lifecycle cho Follow-up Changes (`workflow --init --follow-up <task-id>`)**:
   - Khi một task đã hoàn thành (`completed`), người dùng thường yêu cầu triển khai tiếp các công việc phụ thuộc hoặc sửa đổi bổ sung cho các module liên quan.
   - Tạo task mới từ đầu làm mất liên kết ngữ cảnh (relevantPaths, relevantSpecs, epicId) và buộc agent phải research lại.
   - Cần bổ sung cờ `--follow-up <task-id>` trong `workflow --init` để tự động kế thừa ngữ cảnh, đường dẫn liên quan và epicId từ task đã hoàn thành.
3. **Quy trình Baseline Checks trước khi Freeze Contract**:
   - Khi một check thất bại do lỗi có từ trước (pre-existing lint/build errors), nếu check đó chỉ được chạy sau khi đã freeze contract (`ready` → `verifying`), nó sẽ gây ra vòng lặp replan không cần thiết.
   - Cần cho phép `workflow --run-check` thực thi ngay trong giai đoạn `planning` để kiểm tra baseline, phát hiện lỗi pre-existing và áp dụng waiver hoặc điều chỉnh check trước khi freeze contract.

## 2. Mục tiêu (Goals)
- Mở rộng `ValidationCheck` schema v3 hỗ trợ tùy chọn `cwd?: string`.
- Cập nhật `src/utils/check-runner.ts` nhận tham số `cwd` và thực thi process trong thư mục đó.
- Bổ sung cờ `--cwd <path>` trong CLI `workflow --set-check` và `workflow --run-check`.
- Bổ sung cờ `--follow-up <task-id>` cho `workflow --init` để kế thừa context từ task đã completed.
- Cho phép `workflow --run-check` chạy ở giai đoạn `planning` cho mục đích baseline validation.

## 3. Không thuộc phạm vi (Non-goals)
- Không can thiệp vào Git repository riêng lẻ của từng repo con (không auto-commit/branch).
- Không tự ý thay đổi cấu trúc thư mục của người dùng.

## 4. Acceptance Criteria (Tiêu chí nghiệm thu)
- **ac-1**: Hỗ trợ khai báo `cwd` cho từng validation check qua schema và flag `--cwd`, check-runner thực thi chuẩn xác trong thư mục con.
- **ac-2**: Hỗ trợ cờ `workflow --init --follow-up <task-id>` tự động sao chép `relevantPaths`, `relevantSpecs` và `epicId` từ task cha.
- **ac-3**: Cho phép `workflow --run-check` chạy kiểm thử baseline trong trạng thái `planning` để thu thập bằng chứng trước khi ready.
- **ac-4**: Bộ unit tests và suite gate bao phủ đầy đủ các tính năng trên với tỷ lệ đạt 100%.
