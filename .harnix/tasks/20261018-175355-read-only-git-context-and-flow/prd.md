# PRD: Bổ sung ngữ cảnh Git chỉ đọc vào Preflight và chuẩn hóa quy trình Branching Stash

## 1. Bối cảnh & Vấn đề (Context & Problem)
- Khi phát triển các task trong một Epic hoặc chuyển đổi giữa các task, AI agent thường không biết rõ ngữ cảnh Git hiện tại (đang đứng ở branch nào, working tree có sạch (clean) hay dở dang (dirty), commit HEAD hiện tại là gì).
- Thiếu thông tin này dẫn tới nguy cơ:
  1. Agent thực hiện task mới trên sai branch (ví dụ làm tiếp trên feature branch của task cũ thay vì base branch).
  2. Bị xung đột file chưa commit khi chuyển đổi task (`harnix pause`, `harnix resume`).
- Cần bổ sung trường `git` chỉ đọc (`branch`, `clean`, `commit`) vào kết quả của `harnix status` và `harnix workflow --preflight` để agent nhận thức tức thời trạng thái Git.
- Cập nhật tài liệu hướng dẫn quy chuẩn về Branching Strategy (base branch, target branch), xử lý phân kỳ (divergence) và quy trình chuẩn Stash & Switch khi chuyển đổi task.

## 2. Ranh giới Triển khai (Boundaries)
- **In-Scope:**
  - Cập nhật `src/core/workflow/preflight.ts` và `src/core/status.ts`: Lấy thông tin Git chỉ đọc (`branch`, `clean`, `commit`) an toàn, không throw lỗi nếu không phải git repository hoặc git không có sẵn.
  - Cập nhật tài liệu hướng dẫn quy trình Branching, xử lý divergence và Stash & Switch trong `src/skills/harnix-plan/references/epic.md` hoặc `docs/HARNIX_WORKFLOW.md`.
  - Viết unit test cho Git read-only context trong `test/unit/core/workflow/preflight.test.ts`.
  - Đảm bảo toàn bộ test gates và test suite pass 100%.
- **Out-of-Scope (Non-goals):**
  - Tuyệt đối không tự động thực hiện các lệnh Git làm thay đổi trạng thái (không auto-commit, checkout, push, merge hay stash).
  - Không làm chậm tốc độ của preflight khi không có git.

## 3. Tiêu chuẩn Nghiệm thu Định danh (Acceptance Criteria)
- `[ac-1]`: Harnix status/preflight trả về thông tin Git read-only (`branch`, `clean`, `commit`) an toàn, không làm crash khi chạy trong môi trường không có Git.
- `[ac-2]`: Tài liệu hướng dẫn branching strategy, xử lý lệch nhánh (divergence) và quy trình pause/stash/switch task được bổ sung đầy đủ.
- `[ac-3]`: Toàn bộ test gates pass 100%.

## 4. Ràng buộc Kỹ thuật & Kiến trúc (Constraints)
- Thông tin Git phải được đọc hoàn toàn chỉ đọc (read-only), timeout ngắn nếu gọi command ngoài hoặc sử dụng hàm an toàn.
- Không vi phạm nguyên tắc bảo mật và Rule 6 của Harnix (không tự động commit/push).
