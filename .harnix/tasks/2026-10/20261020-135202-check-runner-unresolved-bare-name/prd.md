# PRD: Tên lệnh trần không tìm thấy trên PATH không còn đi qua cmd.exe

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Epic 2.12.x đã cố định `cmd.exe` và `taskkill` theo đường dẫn System32 tuyệt đối và cho `resolveInvocation` (src/utils/check-runner.ts) tìm tên lệnh trần trên PATH (chỉ mục tuyệt đối). Còn một khe đã ghi nhận trong learning (obs-1646dfe4a8febf82): khi `lookup` không tìm thấy tên trần, `resolveInvocation` vẫn trả `cmd.exe /d /s /c <tên>`, và cmd tự tìm trong thư mục làm việc trước, nên một `tên.cmd` hay `tên.bat` do repo đặt sẵn có thể chạy thay cho lệnh mong muốn.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope:** trên win32, tên lệnh trần mà `lookup` không tìm thấy bị từ chối bằng lỗi rõ ràng; chỉ một danh sách cố định các lệnh nội trang của cmd (`echo`, `dir`, `type`, `ver`, `set`) còn đi qua `cmd.exe`; test; changelog.
- **Out-of-Scope (Non-Goals):** không đổi hành vi trên nền tảng khác, không đổi đường chạy của shim `.cmd`/`.bat` đã resolve, không đổi `.exe`/`.com` chạy trực tiếp, không thêm biến môi trường hay cờ mới.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1**: Trên win32, khi `lookup` không tìm thấy một tên lệnh trần không thuộc danh sách nội trang, `resolveInvocation` ném lỗi nêu tên lệnh và gợi ý dùng đường dẫn đầy đủ hay tên có phần mở rộng; không bao giờ trả `cmd.exe` cho tên đó. Một `tên.cmd` đặt trong thư mục làm việc không được chạy.
- **ac-2**: Các lệnh nội trang `echo`, `dir`, `type`, `ver`, `set` vẫn chạy qua `cmd.exe`; shim `.cmd`/`.bat` đã resolve, `.exe`/`.com` trực tiếp, và mọi nền tảng ngoài win32 giữ nguyên hành vi.
- **ac-3**: Toàn bộ test suite, lint, typecheck và `test:gates` pass; changelog ghi rõ thay đổi.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- `src/utils/check-runner.ts` vẫn là nơi duy nhất `workflow --run-check` khởi chạy process; không thêm phụ thuộc mới.
- Thông báo lỗi chỉ chứa tên lệnh người dùng đã khai, không có đường dẫn tuyệt đối.
- Rủi ro: check hiện có dùng lệnh trần chỉ tồn tại trong cmd (ví dụ lệnh nội trang khác); giảm thiểu bằng danh sách nội trang cố định và thông báo lỗi hướng dẫn rõ.
- Tuân thủ AGENTS.md và các guide trong .harnix/spec/guides/.
