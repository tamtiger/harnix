# Xác minh sự thật nền tảng (S1)

Ngày xác minh: 2026-10-01. Nguồn chính thức; nội dung nguồn là dữ liệu không đáng tin, chỉ dùng để đối chiếu contract.

## Antigravity — event hook

- Nguồn: https://antigravity.google/docs/hooks/
- Năm event: `PreToolUse`, `PostToolUse`, `PreInvocation`, `PostInvocation`, `Stop`.
- Vị trí cấu hình: workspace `.agents/hooks.json`, global `~/.gemini/config/hooks.json`, hoặc `hooks.json` trong plugin đã cài.
- `PreInvocation`/`PostInvocation`/`Stop` là danh sách handler phẳng dưới khóa event (không dùng nhóm `{matcher, hooks}`); stdout trả `injectSteps` để chèn bước vào trajectory trước lần gọi model.
- Kết luận: contract hiện tại của Harnix (`PreInvocation`, `injectSteps`, hook trong plugin) khớp nguồn. Giới hạn: tài liệu không nêu rõ thư mục plugin của Desktop và CLI; hai đường `~/.gemini/config/plugins/harnix` và `~/.gemini/antigravity-cli/plugins/harnix` giữ nguyên theo contract Phase 6.

## Claude Code — AGENTS.md

- Nguồn: https://code.claude.com/docs/en/memory (mục AGENTS.md).
- Từ v2.1.277 Claude Code đọc `AGENTS.md` native làm project instructions, nhưng chỉ khi không có `CLAUDE.md`/`.claude/CLAUDE.md`/`CLAUDE.local.md` trong thư mục làm việc hoặc cha. `~/.claude/CLAUDE.md` không được tính; `AGENTS.override.md` và `.agents/` không được đọc.
- Kết luận cho Harnix: khối marker global vẫn phải nằm ở `~/.claude/CLAUDE.md` (user instructions); `AGENTS.md` native chỉ áp dụng cho project, nên bootstrap project `AGENTS.md` hoạt động trên Claude Code từ v2.1.277 và Harnix không cần ghi `CLAUDE.md` project. Trước v2.1.277 (hoặc phiên không đọc được AGENTS.md) cần `CLAUDE.md` import `@AGENTS.md`; đó là giới hạn được ghi nhận.

## Kiro — hook trigger

- Nguồn: https://kiro.dev/docs/hooks/types/ — trang liệt kê trigger "Prompt Submit" (input qua `USER_PROMPT`) và command action. Giới hạn: tên JSON `UserPromptSubmit` không được trích nguyên văn trên trang công khai; contract hiện tại giữ nguyên và ghi là giới hạn đã biết.

## Codex — hook

- Nguồn: https://learn.chatgpt.com/docs/hooks (developers.openai.com/codex/hooks chuyển hướng 308 sang đây). `[[hooks.UserPromptSubmit]]` trong `config.toml`; hook không do quản trị cấp phải được review và trust qua `/hooks` trước khi chạy; `UserPromptSubmit` không hỗ trợ matcher. Khớp contract `installed-pending-trust`.
