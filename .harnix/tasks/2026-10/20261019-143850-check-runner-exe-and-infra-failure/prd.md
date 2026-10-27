# PRD: Chạy trực tiếp .exe và hướng dẫn đúng khi sửa check đã fail

## Bối cảnh & Vấn đề
`resolveInvocation` (`src/utils/check-runner.ts`) coi mọi tên lệnh không có đuôi và không có dấu phân cách đường dẫn là "bare name" và đẩy qua `cmd.exe /d /s /c`. `dotnet` không có đuôi nên `workflow --run-check ... -- dotnet test --filter "A|B"` bị chặn với `A command contains characters that are unsafe for cmd.exe`, dù `dotnet` thật ra là `dotnet.exe` và không cần shell. Thông báo còn gợi ý đổi sang `pwsh.exe`, gây hiểu nhầm.

Khi một check đã fail (kể cả vì lỗi build như MSB3027 do file bị khóa), `preserveObligations` (`src/core/workflow/obligations.ts`) chỉ nói "phải giữ nguyên hoặc retire kèm ID thay thế mới", không nhắc lệnh `--replace-check` vốn đã cho phép thay lệnh của check fail bằng check mới.

## Ranh giới & Ràng buộc
- Không chạy lệnh qua shell cho `.exe`; chỉ `.cmd`/`.bat` đi qua `cmd.exe` và giữ nguyên bộ chặn metacharacter.
- Không tự phân loại lỗi hạ tầng build theo từng hệ sinh thái (MSB3027...): heuristic dễ nhận nhầm và nới bộ đếm retry; quy tắc bất biến của check đã fail giữ nguyên.
- Tra tên lệnh chỉ trong các thư mục tuyệt đối của `PATH`, bỏ mục rỗng và tương đối, để không chạy nhầm tệp trùng tên nằm trong thư mục làm việc của repository.
- Không đổi schema TaskRecord v3 và không đổi hợp đồng `--run-check` (argv phải khớp lệnh đã khai báo).

## Yêu cầu kỹ thuật cốt lõi
- Thêm `findOnPath(name, env, exists)` (Windows: duyệt `PATH` theo thứ tự, mỗi thư mục thử từng đuôi của `PATHEXT`) và kiểu `ExecutableLookup`.
- `resolveInvocation` nhận tham số `lookup` tùy chọn: bare name resolve ra `.exe` hoặc `.com` thì chạy trực tiếp; ra `.cmd`/`.bat` hoặc không tìm thấy thì giữ đường `cmd.exe` hiện tại. `runCheckProcess` truyền `findOnPath` mặc định; test tiêm lookup giả để xác định.
- Thông báo ở `obligations.ts` nối thêm: `harnix workflow --replace-check <old> <new-id> --reason "<why>"` với `--command`, `--input` hoặc `--cwd` khác.

## Rủi ro & Chiến lược giảm thiểu
- Tên lệnh resolve khác với cmd.exe cũ (ưu tiên `PATHEXT`): chỉ áp dụng khi tìm được `.exe`/`.com`; mọi trường hợp còn lại giữ hành vi cũ.
- Hành vi theo máy (PATH khác nhau): unit test dùng lookup tiêm; một test Windows-only chạy thật `node` với đối số chứa `|`.
