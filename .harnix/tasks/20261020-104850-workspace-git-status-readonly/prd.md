# PRD: Thêm harnix status --workspace: bảng trạng thái Git chỉ đọc của các sub-repo

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Trong workspace lớn (Payment Hub 9 sub-repo, Long Châu 4 sub-repo) người dùng phải chạy `git branch`, `git status` rồi `git fetch/pull` thủ công cho từng repo, dễ sót. Báo cáo đề xuất lệnh `harnix repo status` (bảng nhánh, dirty, ahead/behind) và `harnix repo pull --branch <b>` (kéo đồng loạt các repo sạch).

Đối chiếu ranh giới sản phẩm (`AGENTS.md`): Harnix không có "tích hợp Git tự động", không bao giờ commit, tạo branch, merge, push; không có mạng im lặng. `repo pull`, `repo sync` và `fetch` đổi working tree hoặc chạm mạng nên nằm ngoài ranh giới và không được thêm. Phần bảng trạng thái chỉ đọc thì nằm trong ranh giới: Harnix đã có git context chỉ đọc (`readGitContext` ở `status` và `preflight`) và đã có `discoverWorkspaceMembers`.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope:** `harnix status --workspace [path]` trả JSON bảng trạng thái Git chỉ đọc của các sub-repo; test, README và PRD.
- **Out-of-Scope (Non-Goals):** không `pull`, `sync`, `fetch`, `checkout` hay bất kỳ thao tác ghi Git; không gọi mạng (ahead/behind chỉ theo ref upstream đã có sẵn trong repo); không lệnh public mới ngoài cờ của `status`; không đọc hay ghi `.harnix` của member.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1** JSON có `scope: "workspace"` và `members[]` gồm `name`, `branch` (hoặc detached), `dirty`, `upstream`, `ahead`, `behind`; sắp xếp xác định theo tên; member là thư mục có `.git` (trực tiếp hoặc lồng hai cấp).
- **ac-2** Chỉ đọc và an toàn: chỉ `git rev-parse`, `status`, `rev-list` bằng mảng đối số; timeout từng lệnh; đồng thời bị giới hạn; lỗi một member không làm hỏng bảng; không có đường dẫn tuyệt đối.
- **ac-3** Cờ có trong test hợp đồng CLI, README, PRD; ngoài workspace hoặc không có sub-repo thì danh sách rỗng kèm thông báo; test chặn mọi đường gọi lệnh ghi Git.
- **ac-4** Toàn bộ test suite và `test:gates` pass.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Đã quyết định: dùng cờ `--workspace` của `status`, không thêm lệnh public mới.
- Tái dùng `discoverWorkspaceMembers` (lọc thêm thư mục có `.git`) và `resolveWorkspaceRoot` (trích sang `src/core/workspace`); chạy git qua process runner có timeout, không dùng shell.
- Mỗi member một lệnh `git --no-optional-locks status --porcelain=v2 --branch -z` để lấy nhánh, upstream, ahead/behind và số mục dirty; không có upstream thì `upstream: null`, ahead/behind `null`. Không bao giờ chạy `git fetch`, nên số liệu phản ánh lần fetch gần nhất của người dùng; ghi rõ trong tài liệu.
- Rủi ro: repo rất lớn làm `git status` chậm; giảm thiểu bằng timeout theo member (trạng thái `error`) và giới hạn đồng thời; đường dẫn dài hoặc tên nhánh lạ chỉ được đưa vào đầu ra sau khi cắt độ dài.
