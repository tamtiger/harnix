# PRD: Output --run-check chỉ nêu test lỗi thay vì đuôi log dài

## Vấn đề

Khi một check fail, `--run-check` trả tối đa 2000 ký tự log thô cuối cùng: tốn token mà vẫn khó đọc lỗi. `--brief` (và `--run-checks --brief`) thì không trả gì, nên agent không biết là test đỏ hay lệnh không khởi chạy được và phải chạy lại để đoán. Một lệnh `pnpm` thoát exit 1 vì lỗi môi trường (thiếu package.json, cwd sai) còn bị ghi như test đỏ và tính vào circuit breaker.

## Mục tiêu

Một tóm tắt lỗi ngắn, đọc được ngay, có cả khi `--brief`; lỗi môi trường của launcher không bị ghi như test đỏ.

## Hành vi

- `summarizeCheckOutput(output)`: bỏ mã ANSI; nếu nhận ra báo cáo lỗi của vitest (các dòng `FAIL  <file> > <tên test>` kèm dòng thông điệp đầu tiên) thì liệt kê tối đa 10 mục và 800 ký tự; ngược lại giữ tối đa 600 ký tự cuối. Đường dẫn tuyệt đối của máy được thay bằng `<path>`.
- `outputTail` chỉ có khi check fail (cả `--run-check` lẫn `--run-checks`, có hoặc không `--brief`); khi pass không có. Không bao giờ được lưu vào task.
- `launcherFailure(output, exitCode)`: với exit khác 0, khớp mẫu hẹp (`ERR_PNPM_NO_PKG_MANIFEST`, `ERR_PNPM_NO_SCRIPT`, `Missing script`, `is not recognized as an internal or external command`, `command not found`, `npm error code ENOENT`) thì `--run-check` ném lỗi "could not start" kèm lý do ngắn và không ghi evidence, nên không vào circuit breaker. Không khớp thì giữ hành vi ghi fail như cũ.

## Ngoài phạm vi

- Không đổi cách chạy tiến trình, giới hạn 64 KiB của runner hay hành vi circuit breaker.
- Không phân tích định dạng của runner khác ngoài vitest.

## Rủi ro

Mẫu launcher có thể báo sai; chỉ dùng mẫu hẹp. Báo cáo vitest nằm gần cuối output nhưng nếu bảng coverage đẩy nó ra ngoài 64 KiB cuối thì rơi về đuôi 600 ký tự (vẫn đúng, chỉ kém gọn).
