# Implementation Plan: Khóa bằng test việc mã thoát process luôn khớp error.exitCode của JSON

## Hiện trạng đã đối chiếu với mã
- `src/cli-program.ts:38-53`: mọi lỗi công khai dùng `exitCode = 2`, in message ra stderr (trừ giao thức ẩn) và in `publicCliError(message, exitCode)` ra stdout. Doctor, setup, uninstall đặt `process.exitCode` riêng và không có envelope; `workflow` và `context` ẩn dùng giao thức riêng.
- `test/integration/scenarios/cli-errors.test.ts:28-42` đã khẳng định `runCli` trả 2 và `error.exitCode` là 2 cho một số tình huống.
- Báo cáo người dùng: `repo-map` không cờ thoát 1 trong PowerShell 7 dù JSON ghi 2. Nguyên nhân do người dùng quan sát: wrapper `harnix.ps1` của pnpm cộng PowerShell 7 biến stderr thô thành `NativeCommandError` và ghi đè mã thoát; chuyển hướng stderr (`2>$null`) giữ được 2. Đây là quan sát môi trường, không có test nào kiểm được.

## Execution Slices

### Slice 1 (RED/GREEN)
- [x] [chk-focus] Mở rộng `test/integration/scenarios/cli-errors.test.ts` (không tạo file mới): thêm các ca `repo-map` thiếu cờ, `repo-map` cờ lạ, `repo-map --query` thiếu giá trị, lệnh thiếu project, tham số sai; mỗi ca khẳng định giá trị `runCli` trả về bằng `error.exitCode` trong JSON stdout và message stderr bằng `error.message`. Test chỉ chứng minh tính đồng nhất của public error envelope (giá trị hiện luôn là 2), không chứng minh phủ rộng hơn.

### Slice 2: tài liệu và phát hành
- [x] [chk-gates] Tạo mục "Khắc phục sự cố" mới trong `README.md` (hiện chưa có) và ghi vào `docs/HARNIX_PRD.md`: mã thoát thật nằm ở `error.exitCode` trong JSON stdout; trong PowerShell 7 bọc qua wrapper có thể báo 1 vì stderr, dùng `2>$null` hoặc đọc JSON. Ghi đây là quan sát, không đổi kênh stderr. `pnpm run test:gates`; `pnpm version:sync 2.13.0-dev.4 --summary <text> --kind changed` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Không đổi ngữ nghĩa mã thoát 1 và 2, không đổi kênh stderr, không thêm cờ hay biến môi trường mới.
- Test dưới 400 dòng (kiểm số dòng của `cli-errors.test.ts` trước khi thêm; nếu vượt thì tách ca mới sang file scenario riêng); chỉ format file mình sửa.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e`.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1 | chk-focus | `pnpm exec vitest run test/integration/scenarios/cli-errors.test.ts` | focused |
| ac-2, ac-3 | chk-gates | `pnpm run test:gates` | focused |
| ac-3 | check-suite | `pnpm run test` | full |
