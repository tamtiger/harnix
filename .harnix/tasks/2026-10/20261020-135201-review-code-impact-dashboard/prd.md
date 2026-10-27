# PRD: Sinh dashboard Code impact cho review.md từ Git chỉ đọc

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
`AGENTS.md`, `docs/HARNIX_WORKFLOW.md` và skill `harnix-verify` hứa rằng `review.md` có dashboard `## Code impact` (số file thay đổi và `+ / -`). Đã đối chiếu với mã: `src/core/tasks/task-review.ts` có `CodeImpactItem`, trường `ReviewArtifacts.codeImpact` và `renderCodeImpact`, nhưng `saveTask` trong `src/core/tasks/task-store.ts` dựng `artifacts` chỉ với `prd`, `plan`, `design`, nên không nơi nào tính `codeImpact`. Hệ quả: mục không bao giờ xuất hiện trong `review.md` của bất kỳ task nào (đã kiểm với task vừa hoàn thành). Đây là phần renderer có sẵn nhưng thiếu producer.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope:** module mới `src/core/tasks/code-impact.ts` tính danh sách thay đổi so với `HEAD` bằng Git chỉ đọc; `saveTask` truyền kết quả vào renderer khi task `in_progress` hoặc `verifying`; giữ mục đã có khi task `completed`; test; README và PRD.
- **Out-of-Scope (Non-Goals):** không lưu baseline commit và không đổi schema `TaskRecord` (task bắt đầu trước thời điểm commit nào thì vẫn so với `HEAD`); không lệnh hay cờ public mới; không phân tích diff theo nội dung; không tính cho task `planning` hay `ready`; không ghi vào Git (không add, commit, stash); không thay đổi digest hay check freshness.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1**: `review.md` của task `in_progress` hoặc `verifying` có mục `## Code impact` liệt kê file thay đổi so với `HEAD` (`added`, `modified`, `deleted`; file chưa theo dõi tính là `added`) kèm `+/-`, sắp xếp ổn định, giới hạn số file; ngoài Git hoặc không có thay đổi thì không có mục.
- **ac-2**: Bộ tính chỉ đọc: chỉ chạy `git --no-optional-locks status --porcelain=v2 -z` và `git --no-optional-locks diff --numstat -z HEAD` bằng mảng đối số không shell, timeout ngắn, allowlist chặn lệnh con khác; tối đa 50 file kèm dòng tóm tắt phần bị cắt; đường dẫn tương đối POSIX, không đường dẫn tuyệt đối; lỗi git hay ngoài Git thì bỏ qua mục mà không làm hỏng việc lưu task.
- **ac-3**: Chỉ tính trong `saveTask` khi `in_progress` hoặc `verifying` (bộ chạy git tiêm được cho test); khi `completed` giữ nguyên mục đã có trong `review.md`; `review.md` vẫn là file dẫn xuất không nằm trong digest nên không làm stale evidence; không đổi schema.
- **ac-4**: Toàn bộ test suite, lint, typecheck và `test:gates` pass; README và PRD mô tả mục Code impact.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Quyết định đã chọn mặc định (người dùng có thể đảo ở bước review): so với `HEAD` thay vì baseline lưu trong task, để không đổi schema đóng băng; hạn chế đã biết là sau khi người dùng commit thì task `in_progress` hay `verifying` sẽ thấy ít thay đổi hơn; mục của task `completed` được giữ lại từ lần lưu cuối.
- `src/core/tasks` giới hạn 300 dòng code mỗi file và không được import Commander; `saveTask` chỉ nhận thêm một tham số tùy chọn là bộ chạy git, mặc định dùng `runGit` ở `src/utils/git.ts`.
- Mỗi lần `saveTask` ở trạng thái đó thêm hai lệnh git (timeout 2 giây, chạy song song); không chặn việc lưu khi git chậm hay vắng mặt. Cần kiểm tác động tốc độ lên các test dùng `saveTask`.
- Mọi thay đổi tuân thủ `AGENTS.md` và các guide trong `.harnix/spec/guides/`; không rò rỉ đường dẫn tuyệt đối hay nội dung file.
