# Plan: Thu hẹp phạm vi secret scan, nâng cao chất lượng learning note và quy trình planning

## 1. Mục tiêu và phạm vi
Triển khai 4 tiêu chí nghiệm thu (ac-1 đến ac-4) để loại bỏ false-positive cảnh báo secret, tinh chỉnh thông báo learning, kiểm tra sanity check test files khi resume và hoàn thiện tài liệu hướng dẫn đối chiếu code trong `harnix-plan`.

## 2. Kế hoạch triển khai chi tiết

- [x] 1. Tinh chỉnh `scanTaskSecrets` hỗ trợ placeholder mở rộng, waiver và allowlist (ac-1)
  - Viết test trong `test/unit/core/workflow/secret-scan.test.ts`.
  - Hỗ trợ comment inline `harnix-ignore-secret` / `allow-secret` và mở rộng `PLACEHOLDER` regex cho các mẫu mock/test credential.
- [x] 2. Loại bỏ hint gây nhiễu `No learning captured` và lọc quyết định cục bộ (ac-2)
  - Viết test trong `test/unit/core/workflow/finish.test.ts` và `test/unit/core/journal/learning-notes.test.ts`.
  - Cập nhật `learningHint` trong `src/core/workflow/finish.ts` trả về `undefined` khi không có review notes.
  - Cập nhật `extractObservations` để lọc các quyết định thuần cục bộ.
- [x] 3. Sanity check test files khi resume task (ac-3)
  - Viết test trong `test/unit/core/tasks/task-resume.test.ts`.
  - Cập nhật `resumeTask` trong `src/core/tasks/task-resume.ts` kiểm tra các file test được check tham chiếu và trả về warnings nếu file bị thiếu.
- [x] 4. Bổ sung hướng dẫn đối chiếu code trước khi khóa tiêu chí trong `harnix-plan` (ac-4)
  - Cập nhật tài liệu skill `src/skills/harnix-plan/SKILL.md` và reference `epic.md`.
- [x] 5. Kiểm thử toàn diện và đóng Epic với phiên bản 2.7.0 (ac-1..ac-4)
  - Chạy `test:gates` và `test`.
  - Chạy `pnpm version:sync 2.7.0 --fold-dev --summary "Tinh chỉnh trải nghiệm phát triển và giảm ma sát workflow Harnix"`.
