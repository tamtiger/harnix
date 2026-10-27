# Implementation Plan: Tên lệnh trần không tìm thấy trên PATH không còn đi qua cmd.exe

## Hiện trạng đã đối chiếu với mã
- `src/utils/check-runner.ts:~77-106`: `resolveInvocation` cho win32 dùng `bareName` (không có dấu \ / hay .), `needsCmd = isBatchShim || bareName`; `resolved = bareName ? lookup?.(executable) : undefined`; `.exe`/`.com` chạy trực tiếp; còn lại `command = shimPath(resolved) ?? executable` đi qua `cmd.exe /d /s /c`, nên một tên không resolve được vẫn do cmd tìm.
- `test/unit/utils/check-runner.test.ts` đã phủ `resolveInvocation` và `findOnPath`.

## Hợp đồng (contract)
- Hằng `CMD_BUILTINS = ["dir","echo","set","type","ver"]` (so khớp không phân biệt hoa thường).
- Với win32, `bareName`, `resolved === undefined` và tên không thuộc `CMD_BUILTINS`: ném `Error("Command not found on PATH: <tên>; use its full path or a name with its extension.")`. Khi `lookup` không được cung cấp (lời gọi thuần không có bộ resolve) giữ hành vi cũ; `runCheckProcess` luôn cung cấp `findOnPath` mặc định nên đường chạy thật luôn bị chặn.
- Mọi trường hợp khác giữ nguyên.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/utils/check-runner.test.ts`: tên trần không resolve được ném lỗi nêu đúng tên; tên trần là nội trang vẫn ra `cmd.exe`; `pnpm` resolve ra shim vẫn chạy bằng đường dẫn đã resolve; `.exe` trực tiếp; ca không phải win32 giữ nguyên; lời gọi không có `lookup` giữ hành vi cũ.

### Slice 2 (GREEN)
- [x] [chk-focus] Cài logic trong `resolveInvocation`, rà các lời gọi và test khác dùng tên trần (grep `resolveInvocation`, `runCheck`) để không vỡ; chạy lại test Slice 1.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] `pnpm run test:gates`; `pnpm version:sync 2.14.0-dev.2 --summary <text> --kind fixed` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Không đổi hành vi nền tảng ngoài win32 và đường chạy `.exe`/shim đã resolve; thông báo lỗi không có đường dẫn tuyệt đối.
- Mỗi file trong `src/` dưới 300 dòng code; test dưới 400 dòng; chỉ format file mình sửa.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e` hay heredoc.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2 | chk-focus | `pnpm exec vitest run test/unit/utils/check-runner.test.ts` | focused |
| ac-3 | chk-gates | `pnpm run test:gates` | focused |
| ac-3 | check-suite | `pnpm run test` | full |
