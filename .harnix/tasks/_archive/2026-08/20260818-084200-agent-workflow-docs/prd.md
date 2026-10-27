# PRD — Hoàn thiện hướng dẫn agent và tài liệu workflow Harnix

## Kết quả

Agent đọc instruction của chính repo hoặc consumer repo phải hiểu khi nào Harnix active, route request theo Bypass/Lite/Full, chọn đúng stage skill và dùng hidden workflow transport để persist state hợp lệ. Người dùng đọc README phải biết cài đặt, kích hoạt, trust, gửi yêu cầu cho coding agent và diễn giải kết quả Doctor.

## Trong phạm vi

- Sửa root `AGENTS.md` để triage luôn đứng trước fallback implementation plan và bổ sung activation/skill routing ngắn gọn.
- Bổ sung exact hidden transport `inspect|save|snapshot|finish`, JSON stdin envelope và ownership của từng stage vào consumer AGENTS template, generated workflow và canonical stage skills liên quan.
- Bổ sung README happy path, skill discovery/trust/Doctor guidance; sửa ownership của root `AGENTS.md`, specs, workflow, task, research và journal; xóa ví dụ lặp.
- Thêm regression assertions chứng minh instruction có các contract bắt buộc và không tái xuất hiện fallback implementation vô điều kiện.
- Bump patch version và cập nhật CHANGELOG theo quy tắc repository.

## Ngoài phạm vi

- Không đổi schema, transition, public CLI, platform path, setup trust model hoặc hook protocol.
- Không công khai hidden workflow commands như supported public API.
- Không chỉnh/xóa historical task hoặc journal warnings.

## Rủi ro và bảo toàn

Instruction quá dài hoặc lặp có thể gây context bloat; thay đổi phải ngắn, đặt transport chi tiết ở generated workflow và chỉ nhắc exact owner command trong từng skill. Root `AGENTS.md` là user-owned trong working tree hiện tại nên chỉ sửa đúng section Harnix liên quan. Thay đổi line-ending sẵn có trong `.harnix/.template-hashes.json` phải được giữ nguyên và không tính là sản phẩm của task.