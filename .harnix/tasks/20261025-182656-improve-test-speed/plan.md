# Plan: Tăng tốc toàn bộ test

## Execution Slices

- [x] [chk-slow-files] ac-1: `vitest.config.ts` đặt `isolate: false` (giữ `pool: "forks"`); test version-sync tiêm `format` giả trừ test "formats only the files it wrote" và test CLI
- [x] [chk-structure] ac-3: test-structure giữ sàn số test và assertion; ngưỡng coverage giữ nguyên
- [x] [chk-structure] ac-4: `test/README.md` thêm mục tốc độ: cách đo bằng reporter JSON, lưu ý khôi phục trạng thái toàn cục khi tắt cô lập
- [x] [check-suite] ac-2: đo wall trước/sau, chạy suite ba lần (một lần `--sequence.shuffle`), ghi số đo vào decision; `pnpm version:sync 2.22.0 --fold-dev` đóng epic; CHANGELOG

## Guardrails & Invariants

- Không xóa hay gộp test, không hạ coverage.
- Lệnh gate `pnpm run test` không đổi.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1, ac-2 | chk-slow-files |
| ac-3, ac-4 | chk-structure |
| tất cả | check-suite |
