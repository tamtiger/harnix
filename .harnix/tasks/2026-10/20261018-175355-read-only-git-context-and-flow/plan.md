# Implementation Plan: Bổ sung ngữ cảnh Git chỉ đọc vào Preflight và chuẩn hóa quy trình Branching Stash

## Execution Slice 1: Phân tích & TDD Unit Test cho Git Context
- [x] [check-preflight-git] Viết unit test trong `test/unit/core/workflow/preflight.test.ts` kiểm tra trường `git` trong kết quả preflight (phục vụ ac-1)
  - **Files:** `test/unit/core/workflow/preflight.test.ts`
  - **Verify command:** `pnpm test:unit test/unit/core/workflow/preflight.test.ts`

## Execution Slice 2: Bổ sung Git Read-only Context vào Preflight & Status
- [x] [check-preflight-git] Bổ sung helper đọc Git (`branch`, `clean`, `commit`) an toàn và tích hợp vào `preflight.ts` và `status.ts` (phục vụ ac-1)
  - **Files:** `src/core/workflow/preflight.ts`, `src/core/status.ts`
  - **Verify command:** `pnpm test:unit test/unit/core/workflow/preflight.test.ts`

## Execution Slice 3: Chuẩn hóa tài liệu Branching & Stash Switch Flow
- [x] [check-preflight-git] Cập nhật tài liệu `src/skills/harnix-plan/references/epic.md` và `docs/HARNIX_WORKFLOW.md` hướng dẫn quy trình xác định branch, xử lý divergence và Stash & Switch khi chuyển task (phục vụ ac-2)
  - **Files:** `src/skills/harnix-plan/references/epic.md`, `docs/HARNIX_WORKFLOW.md`
  - **Verify command:** `pnpm test:unit test/unit/core/workflow/preflight.test.ts`

## Execution Slice 4: Kiểm thử toàn diện & Verification Gates
- [x] [check-gates] Chạy kiểm tra test gates kiến trúc và contract để đảm bảo không vi phạm quy tắc hệ thống (phục vụ ac-3)
  - **Verify command:** `pnpm run test:gates`
- [x] [check-suite] Chạy kiểm thử toàn bộ test suite để bảo đảm không có regression (phục vụ ac-3)
  - **Verify command:** `pnpm run test`
