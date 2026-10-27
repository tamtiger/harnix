# Implementation Plan: Thêm --allow-warnings cho doctor để pipeline không fail khi chỉ có cảnh báo

## Hiện trạng đã đối chiếu với mã
- `src/cli-workflow-commands.ts` (khoảng dòng 190-212): lệnh `doctor` có `--fix` và `--global`; sau `diagnoseProject`, in JSON; `process.exitCode = 2` khi `result.project.status === "invalid"` hoặc có integration `invalid`, ngược lại `1` khi `!result.ok`.
- `src/core/doctor/doctor.ts`: `ok: errors === 0 && warnings === 0`; `summary` có `errors`, `warnings`, `fixed`.
- `test/integration/commands/doctor.test.ts` và `test/workflow/cli-contract.test.ts` (liệt kê option của lệnh public theo thứ tự).

## Hợp đồng (contract)
- Option mới `--allow-warnings` ("Exit 0 when doctor finds only warnings; errors and invalid state still fail") ngay sau `--global`.
- Quy tắc mã thoát: invalid thì 2 (không đổi); ngược lại nếu `!result.ok` thì 1, trừ khi `options.allowWarnings === true` và `result.summary.errors === 0` thì giữ 0. JSON không đổi.
- Hàm thuần `doctorExitCode(result, allowWarnings)` đặt ở `src/core/doctor/exit-code.ts` (giữ `cli-workflow-commands.ts`, đã 270 dòng, mỏng); test đơn vị ở `test/unit/core/doctor/exit-code.test.ts`.
- Tài liệu phải đồng bộ cùng lúc: README (hàng `doctor`), `docs/HARNIX_PRD.md` (đoạn nói exit 1 là cảnh báo hay drift cần hành động), và kiểm `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` mục 4 xem có nêu mã thoát doctor không; nếu text đóng gói (template hay skill) đổi thì chạy `pnpm selfhost:sync` và `test:gates`.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/integration/scenarios/doctor-exit.test.ts` (file mới, dùng `runCli` như `cli-errors.test.ts`; `doctor.test.ts` hiện không có `runCli`): dự án có đúng cảnh báo (không lỗi): không cờ thoát 1, `--allow-warnings` thoát 0 và JSON như nhau; dự án có lỗi: cả hai thoát khác 0; project invalid: cả hai thoát 2; `--allow-warnings --fix` chạy được. `test/workflow/cli-contract.test.ts`: thêm assertion MỚI cho option của `doctor` (hiện chưa có). Xác nhận fixture "chỉ cảnh báo" thật sự là warning chứ không phải error (ví dụ gỡ `workflow.md` như `cli-errors.test.ts:151`).

### Slice 2 (GREEN)
- [x] [chk-focus] Khai báo option và áp quy tắc mã thoát; chạy lại test Slice 1.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] Cập nhật bảng lệnh trong `README.md` và mô tả `doctor` trong `docs/HARNIX_PRD.md` (ghi rõ ngữ nghĩa mã thoát); `pnpm run test:gates`; `pnpm version:sync 2.13.0-dev.3 --summary <text> --kind added` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Mặc định của doctor không đổi; `--allow-warnings` không bao giờ nâng một lỗi hay invalid thành thoát 0.
- Không đổi doctor JSON v2; không chạm `--fix`/`--global` ngoài việc cho dùng chung cờ.
- Mỗi file trong `src/` dưới 300 dòng code; test dưới 400 dòng; chỉ format file mình sửa.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e`.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-focus | `pnpm exec vitest run test/unit/core/doctor test/integration/scenarios/doctor-exit.test.ts test/workflow/cli-contract.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
