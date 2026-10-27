# PRD: Thêm --allow-warnings cho doctor để pipeline không fail khi chỉ có cảnh báo

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Báo cáo: `harnix doctor` trả `{"ok":false,...,"summary":{"errors":0,"warnings":52,"fixed":0}}` và thoát 1 dù không có lỗi, làm gián đoạn pipeline tự động. Đề xuất của báo cáo là đổi để chỉ thoát 1 khi `errors > 0`.

Đã đối chiếu với mã: `src/core/doctor/doctor.ts` đặt `ok: errors === 0 && warnings === 0`, và wiring trong `src/cli-workflow-commands.ts` thoát 2 khi project hoặc global integration `invalid`, thoát 1 khi `!result.ok`. Đây là hành vi có chủ đích và nằm trong ngữ nghĩa mã thoát đã đóng băng (`AGENTS.md`: không đổi exit semantics của IMPLEMENTATION_PLAN mục 4 nếu không cập nhật PRD, workflow, migration và test). Đổi mặc định sẽ phá vỡ mọi CI đang dựa vào `doctor` thoát 1 khi có cảnh báo.

Nguồn của 52 cảnh báo chưa rõ: `legacy-task-schema` đã chỉ là `info` với task đã kết thúc (`src/core/doctor/project-tasks.ts`), nên phần lớn có thể là drift global thật hoặc task chưa kết thúc dạng cũ. Cần danh sách findings thật của dự án đó.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope:** cờ opt-in `harnix doctor --allow-warnings` đổi mã thoát khi `errors === 0` và `warnings > 0` từ 1 thành 0; mô tả trong README, PRD và test hợp đồng CLI.
- **Out-of-Scope (Non-Goals):** không đổi mặc định, không đổi trường `ok` hay `schemaVersion: 2` của JSON, không che `errors` hoặc trạng thái `invalid` (vẫn thoát khác 0), không phân loại lại findings trong task này.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1** `--allow-warnings` thoát 0 khi `summary.errors === 0` dù có cảnh báo; JSON giữ nguyên.
- **ac-2** Mặc định không đổi (1 khi có cảnh báo, 2 khi invalid); cờ không che lỗi hay invalid.
- **ac-3** Cờ có trong test hợp đồng CLI, README và PRD; dùng được cùng `--fix` và `--global`.
- **ac-4** Toàn bộ test suite và `test:gates` pass.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Đã quyết định: cờ opt-in `--allow-warnings`, không đổi mặc định (đổi mặc định là thay đổi phá vỡ hợp đồng đóng băng).
- Nguồn 52 warning của người dùng đã xác định: 9 là dữ liệu task lịch sử của project, 43 là drift global thật (Codex thiếu 28 file mới và còn 4 skill cũ, Kiro bị sửa cục bộ, Claude thiếu hook); `harnix update --global` xử lý phần global, task này không phân loại lại findings.
- Chỉ đổi lớp wiring (`cli-workflow-commands.ts`), `diagnoseProject` không đổi; không thêm trường vào doctor JSON v2.
- Rủi ro: người dùng hiểu `ok:false` kèm exit 0 là mâu thuẫn; giảm thiểu bằng mô tả rõ trong help, README và PRD rằng `ok` phản ánh nội dung findings còn mã thoát phản ánh chính sách của cờ.
