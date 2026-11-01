# Plan: cli-error-hints

## Execution Slices

- [x] [chk-focused] Slice 1 (ac-1, ac-6): test đỏ rồi thêm `\nGợi ý:` cho lỗi `workflow-flags.ts`, `--format` (cli-helpers) và `status foo` (commandHints).
- [x] [chk-focused] Slice 2 (ac-2): test đỏ rồi mở rộng `ID_FLAGS` cho cờ id/giá trị với hint token kế tiếp.
- [x] [chk-focused] Slice 3 (ac-3): test đỏ rồi thêm xử lý unknown command trong `commandHints` (facts -> `harnix update`, gần đúng).
- [x] [chk-focused] Slice 4 (ac-4): test đỏ rồi đổi `loadEpicOrThrow` sang `unknownIdError`.
- [x] [chk-focused] Slice 5 (ac-5): test đỏ rồi helper lỗi thiếu dự án trong `project-discovery.ts` và áp cho các lệnh.
- [x] [chk-gates] Slice 6 (ac-7): cập nhật golden đúng chuỗi mới, đồng bộ tài liệu, bump version `2.24.0-dev.2`, `pnpm format`, `pnpm run test:gates`.
- [x] [chk-suite] Slice 7 (ac-7): chạy toàn bộ `pnpm run test` xanh.

## Guardrails & Invariants

- Hợp đồng JSON lỗi và exit code 2 giữ nguyên; thông báo không có hint vẫn không có hint.
- `internal` hook không đổi; id check hợp lệ không bị chặn bởi bảo vệ id.
- Không commit, không đổi frozen schema.

## Verification Matrix

| Tiêu chí | Check |
|---|---|
| ac-1, ac-2, ac-3, ac-4, ac-5, ac-6 | chk-focused |
| ac-7 | chk-gates |
| ac-7 | chk-suite |
