# Implementation Plan: Nâng cấp báo cáo Review thành Dashboard kiểm chứng tích hợp Code Impact

## Execution Slices

### Slice 1: Render Code Impact trong `task-review.ts` & Tests (`ac-1`, `ac-2`, `ac-3`)
- [x] [check-review] Viết unit tests trong `test/unit/core/tasks/task-review.test.ts` kiểm thử hiển thị bảng Code Impact khi có dữ liệu và ẩn đi khi không có.
- [x] [check-review] Hiện thực `CodeImpactItem` và `renderCodeImpact` trong `src/core/tasks/task-review.ts`.

### Slice 2: Bump Minor Version 2.10.0 Đóng Epic & Full Verification
- [x] [check-suite] Đồng bộ version minor `2.10.0` với cờ `--fold-dev` bằng lệnh `pnpm version:sync 2.10.0 --summary "Tái cấu trúc bộ tạo tác Epic, PRD, Plan, Task và Review" --kind changed --fold-dev`.
- [x] [check-suite] Chạy toàn bộ verify plan và test suite dự án để đảm bảo pass 100%.

## Verification Matrix
| Criterion | Check ID | Command | Scope | Status |
|---|---|---|---|---|
| ac-1, ac-2, ac-3 | check-review | `pnpm vitest run test/unit/core/tasks/task-review.test.ts` | focused | Pending |
| ac-1, ac-2, ac-3 | check-suite | `pnpm run test` | full | Pending |
