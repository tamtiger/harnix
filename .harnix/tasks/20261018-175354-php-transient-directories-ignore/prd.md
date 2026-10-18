# PRD: Tự động bỏ qua thư mục tạm, log và cache của PHP và CodeIgniter trong inputDigest

## 1. Bối cảnh & Vấn đề (Context & Problem)
- Trong các dự án PHP, đặc biệt là CodeIgniter (CI3, CI4) và Laravel, framework tự động sinh log và cache liên tục trong quá trình chạy ứng dụng và thực thi test (ví dụ: `application/logs/log-YYYY-MM-DD.php`, `application/cache/`, `writable/logs/`, `writable/cache/`, `storage/logs/`).
- Khi chạy kiểm thử hoặc verify, các file log/cache mới phát sinh khiến thư mục bị thay đổi nội dung.
- Harnix v3 sử dụng cơ chế `inputDigest` chặt chẽ để bảo đảm tính tươi mới của kiểm thử. Nếu các thư mục log/cache tạm thời này không được bỏ qua, `inputDigest` lập tức bị lệch (digest mismatch / stale pass), khiến việc ghi nhận evidence hoặc hoàn thành task bị từ chối dù code nghiệp vụ không hề thay đổi.
- Hiện tại, `src/core/verification/transient-directories.ts` mới chỉ hỗ trợ bỏ qua `bin/obj` (cho .NET) và `build/dist/coverage/out` (cho Node.js/Java/Gradle). Chưa có quy tắc tự động nhận diện dự án PHP/CodeIgniter để bỏ qua các thư mục transient này.

## 2. Ranh giới Triển khai (Boundaries)
- **In-Scope:**
  - Cập nhật `src/core/verification/transient-directories.ts`: Bổ sung rule guarded directory cho PHP.
  - Tự động phát hiện dự án PHP thông qua các marker: `composer.json`, `index.php`, `spark`, `artisan`, `.php-version`.
  - Tự động bỏ qua các thư mục log/cache/writable: `logs`, `cache`, `writable` (và các đường dẫn con như `application/logs`, `application/cache`, `storage/logs`).
  - Viết unit test toàn diện trong `test/unit/core/verification/transient-directories.test.ts` kiểm chứng tính năng.
  - Đảm bảo toàn bộ test gates và test suite pass 100%.
- **Out-of-Scope (Non-goals):**
  - Không bỏ qua các file source code PHP trong `application/models`, `application/controllers`, `src/`, `app/`.
  - Không thay đổi thuật toán hash digest cốt lõi trong `task-digest.ts`.

## 3. Tiêu chuẩn Nghiệm thu Định danh (Acceptance Criteria)
- `[ac-1]`: Module `transient-directories.ts` tự động phát hiện dự án PHP và bỏ qua các thư mục log/cache/writable trong inputDigest.
- `[ac-2]`: Unit test cho transient directories xác nhận các thay đổi trong thư mục log/cache không làm thay đổi inputDigest.
- `[ac-3]`: Toàn bộ test gates pass 100%.

## 4. Ràng buộc Kỹ thuật & Kiến trúc (Constraints)
- Giữ nguyên kiến trúc `createGuardedDirectoryFilter`, không gọi shell ngoài, không thêm dependencies mới.
- Đảm bảo hiệu năng với cơ chế cache `readdir` hiện tại.
