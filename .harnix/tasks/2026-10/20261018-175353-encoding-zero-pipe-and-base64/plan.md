# Implementation Plan: Xóa bỏ mâu thuẫn Rule 9 và chuẩn hóa nạp payload UTF-8 không phụ thuộc pipe

## Phase 1: Tháo gỡ mâu thuẫn Rule 9 trong AGENTS.md và activation.ts
- [x] [check-docs-gates] Sửa đổi Rule 9 trong `AGENTS.md` và `src/templates/harnix/activation.ts` để làm rõ quyền tạo file payload tạm cho `--file` và nghiêm cấm pipe trên Windows (phục vụ ac-1)
  - **Files:** `AGENTS.md`, `src/templates/harnix/activation.ts`
  - **Verify command:** `pnpm run test:gates`

## Phase 2: Loại bỏ hoàn toàn code mẫu pipe trên Windows
- [x] [check-docs-gates] Xóa bỏ code mẫu `$json | harnix workflow` trong `src/templates/harnix/workflow.md` và `docs/HARNIX_WORKFLOW.md`, thay bằng hướng dẫn `--file` (phục vụ ac-2)
  - **Files:** `src/templates/harnix/workflow.md`, `docs/HARNIX_WORKFLOW.md`
  - **Verify command:** `pnpm run test:gates`

## Phase 3: Đồng bộ Self-host và Kiểm tra Gates
- [x] [check-docs-gates] Chạy `pnpm run selfhost:sync` để đồng bộ hash manifest của workflow.md (phục vụ ac-3)
  - **Verify command:** `pnpm run selfhost:sync`
- [x] [check-suite] Chạy toàn bộ test gates kiến trúc và test suite của dự án đảm bảo pass 100% (phục vụ ac-3)
  - **Verify command:** `pnpm run test`
