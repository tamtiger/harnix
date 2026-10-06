# PRD: Bảo mật hook context, learning và thực thi trên Windows

## Vấn đề

Review toàn diện 2.0.4 cho thấy năm nhóm lỗi bảo mật còn mở:

1. `harnix verify-plan` in `projectRoot` tuyệt đối (lộ đường dẫn máy).
2. Hook context nối nội dung file repo vào khung untrusted mà không vô hiệu hóa marker `<<< ... >>>` và dòng `--- x ---`: nội dung repo có thể đóng khung sớm hoặc làm `splitEntries` cắt sai.
3. Redaction learning (`analyzeLearningStatement`) bị lách bằng Unicode (ký tự `Cf`, dạng tương thích NFKC), câu tiếng Việt, lệnh nằm giữa câu, và bỏ sót nhiều dạng credential.
4. `upgrade --apply` chạy `npm` bằng `execFile` trực tiếp nên hỏng trên Windows (`npm.cmd`); check-runner chưa kiểm metacharacter cho executable, đường dẫn `.cmd` có dấu cách và timeout chỉ kill tiến trình cha.
5. `redactPublicErrorMessage` bỏ sót đường dẫn POSIX tuyệt đối ngoài `/home|/Users|/tmp|/var/folders`; stdin của `--cancel` và `--learn` không qua `assertTextIntegrity`.

## Ngoài phạm vi

- Không thêm network hay shell; không đổi giao thức hook; không đổi schema TaskRecord.

## Tiêu chí nghiệm thu

- `ac-1`: `verify-plan` không in đường dẫn tuyệt đối; có test chặn tái diễn.
  **Verifies:** `check-security` (test `buildVerifyPlan` không chứa root tuyệt đối trong JSON).
- `ac-2`: marker trong nội dung file bị vô hiệu hóa; `splitEntries` không bị lừa.
  **Verifies:** `check-security` (test sanitize + test `boundedContext` với nội dung độc hại).
- `ac-3`: redaction chuẩn hóa NFKC, bỏ `\p{Cf}`, gộp whitespace; bắt tiếng Việt, lệnh giữa câu, credential, đường dẫn tuyệt đối.
  **Verifies:** `check-security` (table test các chuỗi đã tái hiện).
- `ac-4`: `upgrade --apply` chạy được trên Windows qua `resolveInvocation`.
  **Verifies:** `check-windows` (test inject `win32`).
- `ac-5`: executable bị kiểm metacharacter; `.cmd` có dấu cách chạy đúng; timeout kill cả cây tiến trình trên Windows.
  **Verifies:** `check-windows` (spawner/killer giả).
- `ac-6`: redact lỗi phủ mọi đường dẫn POSIX tuyệt đối; `--cancel` và `--learn` qua `assertTextIntegrity`.
  **Verifies:** `check-security`.
- `ac-7`: `typecheck`, `lint`, `test` (có coverage, không hạ ngưỡng) exit 0 trên cây mã cuối.
  **Verifies:** `check-typecheck`, `check-lint`, `check-suite`.

## Rủi ro

- Vô hiệu hóa marker làm đổi nội dung context hiển thị: chỉ thay ký tự đánh dấu, giữ nguyên độ dài hợp lý để budget không lệch; test hash `contentHash` vẫn tính trên nội dung gốc (drift không đổi).
- Chuẩn hóa NFKC có thể tăng số câu bị loại khỏi learning: chấp nhận (fail-closed), đây là hướng an toàn.
- Kill cây tiến trình trên Windows dùng `taskkill /T /F` (executable cố định, argv mảng, không shell).
