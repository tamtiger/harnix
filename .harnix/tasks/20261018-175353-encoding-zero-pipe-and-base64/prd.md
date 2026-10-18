# PRD: Xóa bỏ mâu thuẫn Rule 9 và chuẩn hóa nạp payload UTF-8 không phụ thuộc pipe

## 1. Bối cảnh & Vấn đề (Context & Problem)
- Trên môi trường Windows PowerShell 5.1 (môi trường mặc định của nhiều IDE/terminal trên Windows), biến `$OutputEncoding` mặc định là `US-ASCII`.
- Khi truyền chuỗi tiếng Việt hoặc JSON có dấu qua pipeline (`echo '{...}' | harnix workflow --save ...`), PowerShell 5.1 tự động biến đổi các ký tự có dấu thành dấu hỏi `?` (0x3F) hoặc ký tự lạ (mojibake).
- Mặc dù Harnix có cờ `--file <path>`, nhưng tài liệu `AGENTS.md` Rule 9 có câu mâu thuẫn: *"Never create temporary script or JSON files..."*, khiến AI agent hiểu nhầm là bị cấm tạo file JSON payload, từ đó quay lại dùng pipe và gây lỗi.
- Ngoài ra, tài liệu mẫu `workflow.md` vẫn còn ví dụ pipe `$json | harnix workflow --save --brief`.
- Cần giải quyết triệt để vấn đề này bằng cách: tháo gỡ mâu thuẫn trong `AGENTS.md` và `activation.ts` (cho phép tạo file payload tạm trong `.harnix/`), xóa bỏ mọi ví dụ pipe trên Windows, và chuẩn hóa quy ước nạp file payload cho `--save`, `--batch`.

## 2. Ranh giới Triển khai (Boundaries)
- **In-Scope:**
  - Cập nhật `src/templates/harnix/activation.ts`, `src/templates/harnix/workflow.md`, `docs/HARNIX_WORKFLOW.md` và `AGENTS.md`.
  - Làm rõ Rule 9: cho phép tạo file payload tạm (ví dụ `.harnix/payload.json`) để phục vụ cờ `--file`, cấm hoàn toàn dùng pipe trên Windows PowerShell 5.1.
  - Xóa bỏ mọi code mẫu `$json | harnix workflow` trên Windows.
  - Chạy `pnpm run selfhost:sync` để đồng bộ lại manifest và workflow template.
  - Kiểm tra toàn bộ contract test gates (`pnpm run test:gates`).
- **Out-of-Scope (Non-goals):**
  - Không thêm cờ `--payload-base64` do rủi ro phình kích thước và giới hạn dòng lệnh 8K/32K của Windows.
  - Không nới lỏng cơ chế kiểm tra toàn vẹn văn bản trong `src/core/workflow/text-integrity.ts`.

## 3. Tiêu chuẩn Nghiệm thu Định danh (Acceptance Criteria)
- `[ac-1]`: Rule 9 trong `AGENTS.md` và `activation.ts` được điều chỉnh: làm rõ quyền tạo file payload trong `.harnix/` cho `--file`, xóa bỏ mâu thuẫn cấm tạo file tạm.
- `[ac-2]`: Tài liệu `src/templates/harnix/workflow.md` và `docs/HARNIX_WORKFLOW.md` loại bỏ hoàn toàn code mẫu dùng pipe `$json | harnix` trên Windows.
- `[ac-3]`: Toàn bộ test gates (contract, architecture, docs) pass 100%.

## 4. Ràng buộc Kỹ thuật & Kiến trúc (Constraints)
- Bảo toàn giới hạn ngân sách chỉ dẫn (instruction budget) và tính nhất quán giữa template `activation.ts` và file `AGENTS.md`.
- Đảm bảo `pnpm run test:gates` pass tuyệt đối 100%.
