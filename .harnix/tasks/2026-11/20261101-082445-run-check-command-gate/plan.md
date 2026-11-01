# Plan: run-check-command-gate

## Execution Slices

- [x] [chk-focused] Slice 1 (ac-1): test đỏ rồi sửa `run-check.ts` để từ chối check bắt buộc không khai `command` và in lệnh đã khai khi argv khác; giữ hồi quy `run-checks`.
- [x] [chk-focused] Slice 2 (ac-2): test đỏ (bơm lỗi `upsertEpic`) rồi sửa nhánh replay của `save.ts` để chạy lại epic và members còn thiếu, idempotent.
- [x] [chk-gates] Slice 3: đồng bộ tài liệu (PRD, WORKFLOW, changelog), bump version `2.24.0-dev.1`, `pnpm format`, chạy `pnpm run test:gates`.
- [x] [chk-suite] Slice 4: chạy toàn bộ `pnpm run test` xanh.

## Guardrails & Invariants

- Một lệnh khớp declared vẫn ghi pass như cũ; check không bắt buộc không có command vẫn không bị ảnh hưởng ngoài việc đã có.
- Rollback của save khi task chưa commit không đổi.
- Không commit, không đổi frozen schema.

## Verification Matrix

| Tiêu chí | Check |
|---|---|
| ac-1, ac-2 | chk-focused |
| ac-1, ac-2 | chk-gates |
| ac-1, ac-2 | chk-suite |
