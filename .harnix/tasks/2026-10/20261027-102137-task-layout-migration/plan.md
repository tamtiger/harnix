# Kế hoạch: migration bố cục task và epic sang bucket tháng

## Execution Slices

- [x] [chk-migration] Slice 1 (ac-1, ac-2): test đỏ cho `migrateStorageLayout` (task, epic, idempotent, dry-run, không ghi đè, bỏ qua thư mục không rename được, hash trước và sau bằng nhau).
- [x] [chk-migration] Slice 2 (ac-1, ac-2): cài `layout-migration.ts` dưới `withWorkflowLock`, thêm `listLegacyTaskIds` và `listLegacyEpicIds` vào resolver.
- [x] [chk-migration] Slice 3 (ac-1, ac-3): nối vào `updateProject` sau `migrateLegacyEpics`, trường `layout` trong kết quả, `doctor --fix` tính số đã chuyển, `.active` còn dùng được.
- [x] [chk-gates] Slice 4 (ac-3): finding `task-layout-legacy` của doctor, test, đồng bộ PRD, README, AGENTS và workflow docs.
- [x] [chk-migration] Slice 5 (ac-4): chạy migration trên bản sao repo này và ghi số liệu vào decision `trace-copy`.
- [x] [chk-suite] Slice 6: bump `2.23.0-dev.3` kèm changelog, `pnpm run test`.

## Guardrails & Invariants

- Không đổi nội dung file; chỉ đổi thư mục chứa.
- Không ghi đè đích; không xóa gì.
- Idempotent: lần hai không làm gì.

## Verification Matrix

| Check | Chứng minh |
| --- | --- |
| chk-migration | chuyển đúng, idempotent, dry-run, không ghi đè, hash bằng nhau |
| chk-gates | hợp đồng CLI, docs và finding doctor |
| chk-suite | toàn bộ suite xanh |
