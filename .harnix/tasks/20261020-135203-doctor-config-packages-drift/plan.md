# Implementation Plan: doctor báo cấu hình packages trong config.yaml lệch so với phát hiện hiện tại

## Hiện trạng đã đối chiếu với mã
- `src/commands/init.ts:~86`: `packages: detection.packages.map(({ languages, path, technologies }) => ...)` chỉ khi init.
- `src/commands/update.ts:96`: `desiredFiles(config)` dùng config có sẵn; không phát hiện lại `packages`.
- `src/core/doctor/project.ts` và `src/core/doctor/findings.ts` dựng finding; `doctor.ts` tổng hợp `errors`/`warnings` theo `severity`, nên `info` không đổi `ok`.
- `src/core/stack/package-roots.ts` (`findPackageRoots`) và bộ phát hiện stack của init cho danh sách package.

## Hợp đồng (contract)
- Hàm thuần `configPackagesDrift(configured: readonly string[], detected: readonly string[]): string[]` ở `src/core/doctor/config-drift.ts`: các đường dẫn detected không có trong configured (so khớp sau chuẩn hóa POSIX, `.` là gốc), sắp xếp code-unit.
- Finding `config-packages-drift`, severity `info`, path `.harnix/config.yaml`, thông điệp nêu tối đa 10 đường dẫn và `+N more` khi dư, kèm hướng: rà soát rồi sửa `packages` trong config.yaml (user-owned) hay chạy lại `harnix init` sau khi sao lưu.
- Doctor đọc được config và gọi bộ phát hiện đã có dưới giới hạn quét của init; mọi lỗi phát hiện thì bỏ qua êm.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/doctor/config-drift.test.ts` (mới): thiếu package, đủ package, gốc `.`, chuẩn hóa, cắt ở 10 kèm số dư. `test/unit/core/doctor/project.test.ts`: fixture nhiều package với config chỉ có một thì có finding info, `ok` không đổi, repo đủ package thì không có.

### Slice 2 (GREEN)
- [x] [chk-focus] Viết `config-drift.ts`, nối vào `diagnoseProjectSection` (giữ `project.ts` dưới 300 dòng bằng cách đặt logic ở file mới); chạy lại test Slice 1 và toàn bộ `test/unit/core/doctor`.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] README và `docs/HARNIX_PRD.md` mô tả finding `config-packages-drift` (mức info, không ghi config, `harnix update` không phát hiện lại packages); `pnpm run test:gates`; `pnpm version:sync 2.14.0-dev.3 --summary <text> --kind added` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Doctor chỉ đọc; không tự ghi config.yaml; không đổi doctor JSON v2 hay mã thoát mặc định.
- Mỗi file trong `src/` dưới 300 dòng code; test dưới 400 dòng; chỉ format file mình sửa.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e` hay heredoc.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2 | chk-focus | `pnpm exec vitest run test/unit/core/doctor` | focused |
| ac-3 | chk-gates | `pnpm run test:gates` | focused |
| ac-3 | check-suite | `pnpm run test` | full |
