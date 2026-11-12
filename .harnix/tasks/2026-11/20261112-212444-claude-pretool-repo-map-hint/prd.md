# PRD: Hook PreToolUse nhắc dùng repo-map cho Claude Code

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Sau v2.32.2, gợi ý repo-map đã đến được agent qua dòng tip của hook `UserPromptSubmit` và mục 10 trong khối luôn nạp. Thực tế một agent Claude Code vẫn bỏ qua cả hai và dùng Grep, `grep -r`, `sed -n` để tìm symbol. Nhắc nhở nằm ở đầu prompt hoặc trong một danh sách dài thì quá xa thời điểm ra quyết định gọi tool.

Mục tiêu: chèn nhắc nhở **đúng lúc agent sắp gọi Grep hoặc `grep -r`/`rg` theo tên symbol**, bằng hook `PreToolUse` của Claude Code, không chặn tool (quyết định của người dùng ngày 2026-11-12: "nhắc, không chặn").

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope**:
  - Một chế độ hook `PreToolUse` mới cho nền tảng Claude Code, trả `hookSpecificOutput.additionalContext` ngắn, tĩnh.
  - Một nhóm hook `PreToolUse` do Harnix sở hữu trong `~/.claude/settings.json` (matcher `Grep|Bash`), đi qua engine reconcile global hiện có (setup, update, uninstall, doctor).
  - Phát hiện lọc hẹp, không trạng thái: chỉ pattern là một định danh (một từ `[A-Za-z_][A-Za-z0-9_]{2,}`, có thể bọc `\b`) cho Grep, hoặc `grep -r|-R`/`rg` với pattern như vậy cho Bash.
  - Đồng bộ tài liệu, hợp đồng, test, phiên bản.
- **Out-of-Scope (Non-Goals)**:
  - Chặn tool (`permissionDecision: deny`) hoặc đổi quyết định cấp quyền của Claude Code.
  - Nhận diện "đọc lại một file lần hai" (cần trạng thái, vi phạm no-write của hook).
  - Hook `PreToolUse` cho Kiro, Antigravity, Codex, OpenCode, Cursor (chưa có bằng chứng vấn đề ở đó; mở task riêng khi cần).
  - Gọi `repo-map` từ hook (frozen: hook không chạy repo-map query, impact, refresh) hoặc đọc cache.
  - Ghi vào `~/.claude/CLAUDE.md` hay sửa `CLAUDE.md` của người dùng.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1**: Trong dự án Harnix đã khởi tạo, hook PreToolUse của Claude Code với tool Grep hoặc Bash chạy grep -r/rg có pattern là một định danh trả về additionalContext nhắc dùng harnix repo-map --refs <symbol>, và không bao giờ chặn tool.
- **ac-2**: Hook không phát gì, không ghi file, không dùng mạng khi pattern không phải một định danh (chuỗi văn bản, regex), khi tool khác Grep và Bash, hoặc khi cwd nằm ngoài dự án Harnix đã khởi tạo.
- **ac-3**: harnix setup --claude, update --global và uninstall --global --yes cài, cập nhật và gỡ đúng một nhóm hook PreToolUse do Harnix sở hữu (matcher Grep|Bash), giữ nguyên hook của người dùng; doctor nhận biết nhóm này.
- **ac-4**: Tài liệu và hợp đồng đồng bộ (AGENTS.md, PRD, workflow, implementation plan, template), trần token không tăng, phiên bản và CHANGELOG được nâng một lần.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Hook hidden `harnix context` giữ nguyên hợp đồng: nhanh, không ghi, không mạng, no-op ngoài dự án đã khởi tạo; payload `PreToolUse` không cấp quyền chọn target và không được đọc để chọn repository.
- Không ghi cache phiên, không đọc `.harnix/cache`, không chạy repo-map. Quyết định chỉ dựa trên `tool_name` và `tool_input` của sự kiện.
- Phần mô tả hợp đồng "một nhóm `harnix-context` trong `hooks.UserPromptSubmit`" nay thành hai nhóm sở hữu (thêm một nhóm `PreToolUse`); cập nhật PRD, workflow, implementation plan, AGENTS.md và test kiến trúc trong cùng thay đổi. Không đổi tên field, enum, đường dẫn, mã thoát khác.
- Không đụng `~/.claude.json`, credentials, MCP, `projects/`, `history`, `todos/`. Giữ hook của người dùng và nhóm `UserPromptSubmit` hiện có (`preserveIfUnmatched`).
- Nhắc nhở chỉ là văn bản tĩnh, bị trần token và không chứa dữ liệu từ pattern chưa được kiểm (symbol chỉ lặp lại sau khi khớp regex định danh chặt).
- Mọi thay đổi tuân thủ AGENTS.md và các guide trong .harnix/spec/guides/ của dự án, và không để lọt rò rỉ bảo mật.
