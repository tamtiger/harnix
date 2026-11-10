# PRD: Gia cố thực thi tiến trình ngoài (git, launcher, timeout)

## Context & Problem Statement

`src/utils/git.ts` gọi `execFile("git", ...)` và `src/utils/harnix-launcher.ts` gọi `cmd.exe /c harnix --version` bằng tên trần. Trên Windows, khi biến `NoDefaultCurrentDirectoryInExePath` chưa được đặt, tiến trình tìm tệp cùng tên trong thư mục hiện hành trước PATH, nên một repo chứa `git.exe` hoặc `harnix.cmd` giả sẽ bị chạy khi hook `harnix context`, `doctor` hoặc `setup` chạy với cwd là repo đó. `check-runner.ts` đã tránh lỗi này bằng `findOnPath` và `systemExecutable`; hai nơi còn lại chưa dùng. Ngoài ra khi timeout, `taskkill /F` làm sự kiện `close` mang code khác null nên exit code không phải 124, và trên POSIX tiến trình con của check không bị dọn.

## Scope & Boundaries

- Trong phạm vi: `src/utils/git.ts`, `src/utils/harnix-launcher.ts`, `src/utils/check-runner.ts` và test tương ứng.
- Ngoài phạm vi: cách `--run-check` khai báo command và cwd, thêm phụ thuộc mới, đổi hành vi công khai của các lệnh.

## Anchored Acceptance Criteria

- ac-1: git và harnix launcher chỉ tìm executable qua thư mục tuyệt đối của PATH; có test hồi quy.
- ac-2: timeout của check-runner luôn trả exitCode 124.
- ac-3: timeout dọn cả tiến trình con trên POSIX; output đa byte không bị cắt đôi ký tự.

## Architectural & Safety Constraints

Tuân theo `AGENTS.md` và `.harnix/spec/guides/`: dùng mảng đối số, không nối chuỗi shell; `src/utils/check-runner.ts` vẫn là nơi duy nhất `--run-check` khởi chạy tiến trình; tiêm phụ thuộc để test tất định; không in đường dẫn tuyệt đối của máy trong output.
