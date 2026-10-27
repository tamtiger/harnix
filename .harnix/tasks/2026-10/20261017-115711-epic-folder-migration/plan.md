# Implementation Plan: Nhóm Epic vào folder riêng và xây dựng bộ di chuyển dữ liệu tương thích ngược

## Phase 1: Test-First cho Cấu trúc Folder & Migration Engine
- [x] [check-epic-unit] Viết failing test cho việc ghi/đọc epic từ thư mục `.harnix/epics/<id>/epic.json` (phục vụ ac-1, ac-3)
  - **Files:** `test/unit/core/epics/epic.test.ts`
  - **Verify command:** `pnpm test:unit test/unit/core/epics/epic.test.ts`
- [x] [check-epic-unit] Viết failing test cho module migrate tự động từ file phẳng cũ sang folder mới (phục vụ ac-2)
  - **Files:** `test/unit/core/epics/migrate.test.ts`
  - **Verify command:** `pnpm test:unit test/unit/core/epics/migrate.test.ts`

## Phase 2: Triển khai Cấu trúc Lưu trữ Folder cho Epic
- [x] [check-epic-unit] Cập nhật hàm `upsertEpic`, `resolveEpicFile` và `renderEpicMarkdown` trong `src/core/epics/epic.ts` để ghi ra `.harnix/epics/<id>/epic.json` và `epic.md` (phục vụ ac-1)
  - **Files:** `src/core/epics/epic.ts`
- [x] [check-epic-unit] Triển khai cơ chế đọc fallback trong `loadEpicRecord` và `loadEpicOrThrow`: ưu tiên đọc `.harnix/epics/<id>/epic.json`, nếu không thấy fallback sang `.harnix/epics/<id>.json` (phục vụ ac-3)
  - **Files:** `src/core/epics/epic.ts`

## Phase 3: Triển khai Migration Engine An toàn & Idempotent
- [x] [check-epic-unit] Mở rộng `src/core/epics/migrate.ts` để tự động quét các file phẳng `<id>.json` và di chuyển an toàn vào folder `<id>/epic.json` (phục vụ ac-2)
  - **Files:** `src/core/epics/migrate.ts`
- [x] [check-epic-unit] Kết nối migration vào `harnix update` và `doctor --fix`
  - **Files:** `src/core/doctor/`

## Phase 4: Full Suite Verification & Code Cleanliness
- [x] [check-suite] Chạy toàn bộ unit test suite của epics và toàn bộ project test
  - **Verify command:** `pnpm test:unit test/unit/core/epics && pnpm run test`
- [x] [check-suite] Kiểm tra tuân thủ kiến trúc và giới hạn dưới 300 LOC/file
  - **Verify command:** `pnpm test test/workflow/architecture.test.ts`
