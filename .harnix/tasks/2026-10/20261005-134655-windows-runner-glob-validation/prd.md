# Yêu cầu sản phẩm (PRD)

## Bối cảnh và vấn đề
Trong quá trình triển khai thực tế trên môi trường Windows và các dự án multi-package, Harnix gặp hai lỗi nghiêm trọng tại tầng thực thi và kiểm định:
1. Khi chạy các lệnh như `npm.cmd run test` qua `harnix workflow --run-check`, Node.js trên Windows ném lỗi `spawn EINVAL` do cơ chế bảo mật (CVE-2024-27980) của Node.js yêu cầu các tệp batch/cmd (`.cmd`, `.bat`) phải được thực thi thông qua shell `cmd.exe /d /s /c`. Hiện tại `resolveInvocation` trong `src/utils/check-runner.ts` chỉ bọc `cmd.exe` cho các lệnh bare name không chứa dấu chấm (`.`), khiến `npm.cmd`, `pnpm.cmd` bị gọi trực tiếp qua `spawn` và văng lỗi `EINVAL`.
2. Khi khai báo `inputs` cho check (ví dụ `frt-payment-portal-web/test/**`), nếu glob không khớp bất kỳ file nào (do dự án đặt test trong `src/`), Harnix chỉ báo lỗi chung chung `TaskRecord v3 validation inputs are invalid` hoặc `Verification input pattern for check <id> matched no files` mà không chỉ ra pattern cụ thể nào bị rỗng, cũng không gợi ý các file/thư mục hiện có.

## Mục tiêu
1. Đảm bảo mọi lệnh thực thi trên Windows có đuôi `.cmd`, `.bat` hoặc bare name đều được route an toàn qua `cmd.exe /d /s /c` mà không xảy ra `spawn EINVAL`.
2. Cải thiện chẩn đoán kiểm định input globs: khi một pattern không match bất kỳ file nào, đưa ra thông báo lỗi rõ ràng nêu đích danh pattern và check ID vi phạm, kèm theo danh sách gợi ý.
3. Giữ vững 100% tính an toàn khi thực thi lệnh (từ chối các ký tự metacharacter nguy hiểm của `cmd.exe`).

## Tiêu chí nghiệm thu (Acceptance Criteria)

### ac-1: check-runner nhận diện các tệp .cmd, .bat trên Windows và route an toàn qua cmd.exe /d /s /c mà không bị spawn EINVAL
**Verifies:** `check-windows-runner` (`pnpm vitest run test/unit/utils/check-runner.test.ts`)
- `resolveInvocation` nhận diện cả executable bare name và executable kết thúc bằng `.cmd`, `.bat` (không phân biệt hoa thường, có hoặc không có đường dẫn đầy đủ) trên nền tảng `win32` và bọc trong `cmd.exe /d /s /c`.
- Kiểm tra an toàn ký tự `CMD_METACHARACTERS` trên các đối số truyền vào `cmd.exe`.
- Kiểm thử thực tế `runCheckProcess` với tệp `.cmd` hoặc mock launcher trên Windows không bị ném lỗi `spawn EINVAL`.

### ac-2: Validation input globs và computeInputDigest thông báo chính xác glob nào không match file nào thay vì lỗi chung chung
**Verifies:** `check-input-globs` (`pnpm vitest run test/unit/core/tasks/task-validate-contracts.test.ts test/unit/core/verification/input-digest.test.ts`)
- Trong `src/core/verification/input-digest.ts`, khi một input pattern không match file nào hoặc tất cả các file bị filter loại bỏ, thông báo lỗi phải nêu rõ `checkId` và chính xác chuỗi `input` pattern bị lỗi.
- Trong `src/core/tasks/task-validate-contracts.ts`, thông báo lỗi validation inputs cho TaskRecord v3 phải chỉ rõ check ID và lý do vi phạm cụ thể thay vì chỉ ném chuỗi tĩnh `TaskRecord v3 validation inputs are invalid.`.

### ac-3: Toàn bộ test suite unit, workflow và acceptance của Harnix vượt qua 100% exit code 0
**Verifies:** `check-suite` (`pnpm run test:acceptance`)
- Toàn bộ các bộ test hiện hữu của Harnix (unit, integration, migration, platform, workflow, safety) đều vượt qua và không bị hồi quy.
