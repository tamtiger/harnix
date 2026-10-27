# Epic: Tối ưu hóa khả năng chống lỗi encoding, inputDigest cho PHP và trải nghiệm vận hành Harnix

Nâng cao độ tin cậy và trải nghiệm vận hành của Harnix trên môi trường Windows và dự án PHP/CodeIgniter: triệt tiêu hoàn toàn rủi ro encoding UTF-8 thông qua chuẩn hóa Rule 9 và nạp file payload, tự động bỏ qua thư mục transient PHP/CodeIgniter để bảo vệ inputDigest, tăng cường nhận biết Git read-only trong Preflight, rút gọn hướng dẫn phòng thủ cho tích hợp API đối tác, nghiên cứu và hỗ trợ điều phối song song Multi-Agent qua Git Worktree, loại bỏ cơ chế dual-write file phẳng cho Epic, và nâng cấp chẩn đoán lỗi chi tiết.

- **Cập nhật:** 2026-10-18 18:54:07 +07:00

## Non-goals

- Không bổ sung daemon chạy nền hoặc phá vỡ nguyên tắc 1 package, 1 executable.
- Không tự ý mutate Git (commit, push, checkout) mà chỉ hỗ trợ read-only awareness.
- Không làm thay đổi schema của TaskRecord v3 hay EpicRecord v1.

## Next task

Không còn task nào chưa hoàn tất.

## Members (8 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261018-175353-encoding-zero-pipe-and-base64` | Xóa bỏ mâu thuẫn Rule 9 và chuẩn hóa nạp payload UTF-8 không phụ thuộc pipe | `full` | `completed` |
| 2 | `20261018-175354-php-transient-directories-ignore` | Tự động bỏ qua thư mục tạm, log và cache của PHP và CodeIgniter trong inputDigest | `full` | `completed` |
| 3 | `20261018-175355-read-only-git-context-and-flow` | Bổ sung ngữ cảnh Git chỉ đọc vào Preflight và chuẩn hóa quy trình Branching Stash | `full` | `completed` |
| 4 | `20261018-175356-defensive-architecture-two-tier-guide` | Chuẩn hóa Two-Tier Verification và hướng dẫn tích hợp bền bỉ trong PHP Guide | `lite` | `completed` |
| 5 | `20261018-175357-multi-agent-worktree-research` | Khảo sát thực nghiệm Multi-Agent Worktree và xây dựng đặc tả điều phối | `full` | `completed` |
| 6 | `20261018-175358-multi-agent-worktree-orchestration` | Hỗ trợ không gian Worktree và xây dựng quy trình điều phối Epic Multi-Agent | `full` | `completed` |
| 7 | `20261018-175359-epic-pure-folder-storage` | Loại bỏ dual-write file phẳng và chuẩn hóa lưu trữ Epic thuần folder | `full` | `completed` |
| 8 | `20261018-175400-dx-error-diagnostics-and-epic-decoupling` | Chẩn đoán lỗi validation chi tiết và tách biệt thao tác Epic độc lập | `full` | `completed` |

## Task Overview & Scope

### 1. `20261018-175353-encoding-zero-pipe-and-base64` — Xóa bỏ mâu thuẫn Rule 9 và chuẩn hóa nạp payload UTF-8 không phụ thuộc pipe

- **Trạng thái:** `completed`
- **Mục tiêu:** Cập nhật AGENTS.md và activation.ts tháo gỡ mâu thuẫn Rule 9 (cho phép tạo file payload tạm trong .harnix/); xóa bỏ toàn bộ code mẫu pipe trên Windows trong workflow.md và HARNIX_WORKFLOW.md; bảo đảm lệnh --save --file hoạt động ổn định.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261018-175354-php-transient-directories-ignore` — Tự động bỏ qua thư mục tạm, log và cache của PHP và CodeIgniter trong inputDigest

- **Trạng thái:** `completed`
- **Mục tiêu:** Cập nhật transient-directories.ts để tự động bỏ qua logs, cache, application/logs, application/cache, writable, storage/logs khi tính inputDigest trong dự án PHP.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261018-175355-read-only-git-context-and-flow` — Bổ sung ngữ cảnh Git chỉ đọc vào Preflight và chuẩn hóa quy trình Branching Stash

- **Trạng thái:** `completed`
- **Mục tiêu:** Bổ sung trường git chỉ đọc (branch, clean, commit) vào kết quả status/preflight; cập nhật tài liệu hướng dẫn về xác định base branch, target branch, xử lý divergence và quy trình Stash & Switch khi chuyển task.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261018-175356-defensive-architecture-two-tier-guide` — Chuẩn hóa Two-Tier Verification và hướng dẫn tích hợp bền bỉ trong PHP Guide

- **Trạng thái:** `completed`
- **Mục tiêu:** Cập nhật gọn nhẹ src/guides/languages/php.md bổ sung quy chuẩn 2 tầng kiểm thử (unit mock + CLI dry-run/integration) và kiến trúc post-commit decoupling theo chuẩn hướng dẫn Harnix.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 5. `20261018-175357-multi-agent-worktree-research` — Khảo sát thực nghiệm Multi-Agent Worktree và xây dựng đặc tả điều phối

- **Trạng thái:** `completed`
- **Mục tiêu:** Thực hiện khảo sát thực nghiệm có đối chiếu mã nguồn và tài liệu chính thức của Antigravity/Claude Code/Cursor về quản lý branch worktree; xác định phương án xử lý conflict state (.active, epic.md) khi merge và soạn thảo spec.md cho Epic.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 6. `20261018-175358-multi-agent-worktree-orchestration` — Hỗ trợ không gian Worktree và xây dựng quy trình điều phối Epic Multi-Agent

- **Trạng thái:** `completed`
- **Mục tiêu:** Cải tiến Harnix nhận biết và xử lý mượt mà trên các Git worktree độc lập; xử lý hòa giải file trạng thái tránh conflict khi merge branch và cung cấp tài liệu skill điều phối cho Agent Trưởng.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 7. `20261018-175359-epic-pure-folder-storage` — Loại bỏ dual-write file phẳng và chuẩn hóa lưu trữ Epic thuần folder

- **Trạng thái:** `completed`
- **Mục tiêu:** Loại bỏ việc ghi đúp file phẳng (.json và .md) trong src/core/epics/epic.ts, chỉ ghi ra folder .harnix/epics/<id>/epic.json|md nhưng vẫn duy trì fallback đọc cho legacy epics; cập nhật test kiểm thử tương ứng.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 8. `20261018-175400-dx-error-diagnostics-and-epic-decoupling` — Chẩn đoán lỗi validation chi tiết và tách biệt thao tác Epic độc lập

- **Trạng thái:** `completed`
- **Mục tiêu:** Tách biệt thông báo lỗi chi tiết cho task validation (id, mode, status, checkpoint hợp lệ); chuẩn hóa cwd giữa --set-check và --save; cho phép khởi tạo task thành viên mà không cướp active pointer.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

## Supporting Artifacts

- [`research.md`](./research.md) — Khảo sát công nghệ & đối sánh giải pháp.
- [`spec.md`](./spec.md) — Đặc tả thiết kế miền & hợp đồng kiến trúc.
