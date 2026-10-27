# Implementation Plan: Tự động bỏ qua thư mục tạm, log và cache của PHP và CodeIgniter trong inputDigest

## Execution Slice 1: Phân tích & Viết Failing Test (TDD)
- [x] [check-transient-dirs] Viết unit test trong `test/unit/core/verification/transient-directories.test.ts` mô phỏng dự án PHP/CodeIgniter (có `composer.json`, `index.php`, `spark`, `artisan`) với các thư mục `logs`, `cache`, `application/logs`, `application/cache`, `writable`, `storage/logs` (phục vụ ac-2)
  - **Files:** `test/unit/core/verification/transient-directories.test.ts`
  - **Verify command:** `pnpm test:unit test/unit/core/verification/transient-directories.test.ts`

## Execution Slice 2: Cập nhật quy tắc Guarded Directory cho PHP
- [x] [check-transient-dirs] Cập nhật `GUARDED_DIRECTORY_RULES` và `createGuardedDirectoryFilter` trong `src/core/verification/transient-directories.ts` để nhận diện marker PHP và bỏ qua các thư mục transient (phục vụ ac-1)
  - **Files:** `src/core/verification/transient-directories.ts`
  - **Verify command:** `pnpm test:unit test/unit/core/verification/transient-directories.test.ts`

## Execution Slice 3: Kiểm thử toàn diện & Verification Gates
- [x] [check-gates] Chạy kiểm tra test gates kiến trúc và contract để đảm bảo không vi phạm quy tắc hệ thống (phục vụ ac-3)
  - **Verify command:** `pnpm run test:gates`
- [x] [check-suite] Chạy kiểm thử toàn bộ test suite để bảo đảm không có regression (phục vụ ac-3)
  - **Verify command:** `pnpm run test`
