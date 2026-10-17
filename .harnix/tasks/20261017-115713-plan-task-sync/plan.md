# Implementation Plan: Xây dựng cơ chế tự động đồng bộ hai chiều giữa Plan checklist và Task state

## Execution Slices

### Slice 1: Module Đồng bộ Checklist `plan-sync.ts` & Unit Tests (`ac-3`)
- [x] [check-sync] Viết unit tests trong `test/unit/core/workflow/plan-sync.test.ts` kiểm thử hàm `syncPlanChecklistPass`.
- [x] [check-sync] Hiện thực `src/core/workflow/plan-sync.ts` với logic regex an toàn, xử lý các tag `[chk-id]`, \`chk-id\` và check-id ở đầu item.

### Slice 2: Tích hợp Đồng bộ vào Evidence Workflow (`ac-1`, `ac-2`)
- [x] [check-sync] Tích hợp gọi `syncPlanChecklistPass` vào `src/core/workflow/evidence-flags.ts` khi `result === "pass"`.
- [x] [check-sync] Tích hợp gọi `syncPlanChecklistPass` vào `src/core/workflow/evidence.ts` khi `evidence.result === "pass"`.
- [x] [check-sync] Viết integration test trong `test/unit/core/workflow/run-check.test.ts` và `test/unit/core/workflow/evidence-flags.test.ts`.

### Slice 3: Bump Version & Full Verification
- [x] [check-suite] Chạy đồng bộ version `2.10.0-dev.3` bằng `pnpm version:sync`.
- [x] [check-suite] Chạy toàn bộ verify plan và test suite dự án để đảm bảo pass 100%.

## Verification Matrix
| Criterion | Check ID | Command | Scope | Status |
|---|---|---|---|---|
| ac-1, ac-2, ac-3 | check-sync | `pnpm vitest run test/unit/core/workflow/plan-sync.test.ts test/unit/core/workflow/run-check.test.ts test/unit/core/workflow/evidence-flags.test.ts` | focused | Pending |
| ac-1, ac-2, ac-3 | check-suite | `pnpm run test` | full | Pending |
