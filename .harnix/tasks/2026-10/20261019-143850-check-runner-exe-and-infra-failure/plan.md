# Implementation Plan: Chạy trực tiếp .exe và hướng dẫn đúng khi sửa check đã fail

## Hiện trạng đã đối chiếu với mã
- `src/utils/check-runner.ts`: `resolveInvocation(executable, args, platform)` coi tên không có `.` và không có `/` `\` là `bareName` và đưa qua `cmd.exe`; `CMD_METACHARACTERS = /[&|<>^%"\r\n]/u` chặn `|`. `runCheckProcess` gọi nó và spawn không shell. Nơi gọi: `core/workflow/run-check.ts`, `commands/upgrade.ts`.
- `src/core/workflow/obligations.ts` (khoảng dòng 199-203): thông báo "must retain failed check ... or retire it unchanged with a new required replacement ID" không nhắc `--replace-check`; `replace-check.ts` đã hỗ trợ thay check fail bằng lệnh khác.

## Hợp đồng (contract)
- `export type ExecutableLookup = (name: string) => string | undefined`; `export function findOnPath(name, env = process.env, exists = existsSync)` chỉ dùng hàm đường dẫn `win32`, bỏ qua mục PATH rỗng/tương đối, thử mỗi thư mục theo thứ tự PATH rồi từng đuôi theo thứ tự PATHEXT (mặc định `.COM;.EXE;.BAT;.CMD`).
- `resolveInvocation(executable, args, platform = process.platform, lookup?)`: chỉ khi `platform === "win32"` và là bare name; `lookup` trả đường dẫn kết thúc `.exe`/`.com` thì trả `{ executable: <đường dẫn>, args }` không qua cmd; còn lại như cũ.
- `CheckProcessDependencies.lookup?: ExecutableLookup`; `runCheckProcess` dùng `dependencies.lookup ?? findOnPath`.
- Thông báo obligations giữ nguyên câu cũ làm tiền tố, nối thêm `To change what it runs, use: harnix workflow --replace-check <id> <new-id> --reason "<why>" with a different --command, --input or --cwd.`

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/utils/check-runner.test.ts`: bare name resolve ra `.exe` chạy trực tiếp với đối số `A|B`; resolve ra `.CMD` giữ đường cmd và vẫn chặn `a|b`; không tìm thấy thì giữ đường cmd; posix không gọi lookup; `runCheckProcess` spawn đúng đường dẫn đã resolve; `findOnPath` theo thứ tự PATH/PATHEXT, bỏ mục tương đối, mặc định PATHEXT; một test Windows-only chạy thật `node` với `A|B`.
- [x] [chk-focus] `test/unit/core/workflow/replace-check.test.ts`: sửa `--command` của check đã fail bằng `--set-check` thì lỗi chứa `harnix workflow --replace-check check <new-id> --reason`.

### Slice 2 (GREEN)
- [x] [chk-focus] Cài `findOnPath`, `ExecutableLookup`, tham số `lookup` và nhánh chạy trực tiếp trong `check-runner.ts`; nối gợi ý `--replace-check` trong `obligations.ts`; chạy lại các test của Slice 1 cho xanh.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] `pnpm run test:gates`; `pnpm version:sync 2.12.0-dev.3 --summary <text> --kind fixed` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Không chạy lệnh qua shell cho `.exe`; `.cmd`/`.bat` vẫn qua `cmd.exe` với bộ chặn metacharacter nguyên vẹn.
- Hành vi của `commands/upgrade.ts` (chạy `npm`) không đổi: `npm` resolve ra `.cmd` nên vẫn đi qua cmd.
- Mỗi file trong `src/` dưới 300 dòng code; `src/utils/check-runner.ts` vẫn là nơi duy nhất `--run-check` khởi động tiến trình.
- Test dùng thư mục tạm cô lập; test phụ thuộc Windows dùng `it.runIf`.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2 | chk-focus | `pnpm exec vitest run test/unit/utils/check-runner.test.ts test/unit/core/workflow/replace-check.test.ts` | focused |
| ac-3 | chk-gates | `pnpm run test:gates` | focused |
| ac-3 | check-suite | `pnpm run test` | full |
