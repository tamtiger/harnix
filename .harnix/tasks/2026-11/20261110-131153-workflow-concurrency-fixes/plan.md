# Plan: Sửa tranh chấp khóa và mất cập nhật trong workflow

## Execution Slices

- [x] [chk-focus] Slice 1 (ac-1): `withWorkflowLock` dùng `.harnix/tmp/workflow.lock`; test hai cách viết đường dẫn cùng một khóa.
- [x] [chk-focus] Slice 2 (ac-2): `tickPlanChecklist` và `syncPlanChecklistPass` chạy dưới `withWorkflowLock`; test chờ khóa.
- [x] [chk-focus] Slice 3 (ac-3): `upsertEpic` merge `createdAt` và `order`; test giữ và test thay thế.
- [x] [chk-focus] Slice 4 (ac-4): `pauseProjectTask` và `resumeProjectTask` dưới khóa; test chờ khóa.
- [x] [chk-focus] Slice 5 (ac-5): regex test file không còn `lastIndex`, `CHECK_UNCHECKED` dùng chung với cổng `verifying`, `run-checks` dùng `now` đã tiêm; test hồi quy.
- [x] [chk-suite] Slice 6: format, lint, typecheck, toàn suite; bump `2.32.0-dev.2` và CHANGELOG.

## Guardrails & Invariants

- Khóa không re-entrant: không gọi hàm có khóa từ trong vùng đã khóa (evidence gọi `syncPlanChecklistPass` sau khi `saveWorkflow` nhả khóa).
- Không đổi schema, enum, transition hay golden.

## Verification Matrix

| Check | Chứng minh | Tiêu chí |
| --- | --- | --- |
| chk-focus | test unit của workflow, tasks, epics và lệnh pause/resume | ac-1 … ac-5 |
| chk-suite | toàn suite | ac-1 … ac-5 |
