# Plan: Gia cố thực thi tiến trình ngoài

## Execution Slices

- [x] [chk-focus] Slice 1 (ac-1): thêm `resolveGitExecutable` vào `git.ts` (Windows chỉ nhận `git.exe` tìm qua `findOnPath`, thiếu thì ném lỗi; nơi khác giữ `git`). RED: test đơn vị cho hàm và test thực trên Windows (sao chép `node.exe` thành `git.exe` trong cwd, PATH không có git, `runGit` phải từ chối). GREEN: `readOnly` dùng hàm này.
- [x] [chk-focus] Slice 2 (ac-1): `lookupHarnixLauncher` kiểm tra `harnix` qua `findOnPath` có thể tiêm (Windows), rồi chạy bằng `runCheckProcess` với cwd là thư mục tạm thay vì `cmd.exe /c harnix` trần. RED: test cập nhật (không có trên PATH thì trả false và runner không được gọi).
- [x] [chk-focus] Slice 3 (ac-2): `runCheckProcess` đặt cờ `timedOut` và ép `exitCode` 124 khi timer bắn. RED: test emit `close` với code 1 sau timeout.
- [x] [chk-focus] Slice 4 (ac-3): `killProcessTree` trên POSIX dùng nhóm tiến trình (`detached` và `process.kill(-pid)`), output ghép bằng `StringDecoder`. RED: test với chuỗi đa byte bị cắt ở ranh giới chunk.
- [x] [chk-suite] Slice 5: chạy `pnpm run format`, lint, typecheck và toàn suite; bump dev version và CHANGELOG theo chính sách epic.

## Guardrails & Invariants

- `check-runner.ts` vẫn là nơi duy nhất `--run-check` khởi chạy tiến trình; không thêm shell, không nối chuỗi lệnh.
- Hành vi trên POSIX của `git` và `harnix` không đổi khi PATH hợp lệ.
- Không tạo file ngoài `.harnix/tmp/` cho script tạm; không sửa `golden`.

## Verification Matrix

| Check | Chứng minh | Tiêu chí |
| --- | --- | --- |
| chk-focus | test `test/unit/utils` cho git, launcher, check-runner | ac-1, ac-2, ac-3 |
| chk-suite | toàn suite `pnpm run test` | ac-1, ac-2, ac-3 |
