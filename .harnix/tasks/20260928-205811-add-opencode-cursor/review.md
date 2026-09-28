# [13] Thêm OpenCode và Cursor qua platform registry

- **ID:** 20260928-205811-add-opencode-cursor
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:11.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/6 acceptance criteria met

## Goal

Thêm đúng hai nền tảng OpenCode và Cursor chỉ bằng bản ghi registry + fixture (chứng minh registry). OpenCode: marker block trong ~/.config/opencode/AGENTS.md giữ nội dung ngoài block; xử lý rõ rủi ro tạo file làm OpenCode ngừng dùng dự phòng ~/.claude/CLAUDE.md; skill qua skill sink chung; không có hook shell nên chạy chế độ không hook, không cài plugin JS mặc định. Cursor: không có file instruction global (User Rules chỉ qua UI) nên dựa vào skill + chế độ không hook; hook sessionStart trong ~/.cursor/hooks.json chỉ là tăng cường tùy chọn, bật khi đã xác minh schema additional_context; không dùng beforeSubmitPrompt. Chống trùng skill vì cả hai tool đọc nhiều thư mục (~/.agents/skills, ~/.claude/skills, ~/.cursor/skills, ~/.codex/skills, ~/.config/opencode/skills). Flag --opencode, --cursor cho setup/update/uninstall/doctor --global. Xác minh lại mọi đường dẫn, biến môi trường relocate root và schema hook bằng tài liệu chính thức lúc làm task (design.md §10).

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thêm tool nào khác ngoài OpenCode và Cursor.
- Không cài plugin JS/extension mặc định, không ghi User Rules của Cursor bằng cơ chế không chính thức, không ghi file project-local, không đụng MCP/credentials/settings không thuộc Harnix.

## Acceptance criteria

- `ac-opencode-setup` (pending): setup/update/doctor/uninstall --global --opencode chạy đúng qua fake home: marker block trong ~/.config/opencode/AGENTS.md, giữ nội dung ngoài block; hành vi với dự phòng ~/.claude/CLAUDE.md được chọn, test và ghi rõ.
- `ac-cursor-setup` (pending): setup/update/doctor/uninstall --global --cursor chạy đúng qua fake home; skill được Cursor đọc thấy; hook sessionStart chỉ được cài khi schema đã xác minh, nếu không doctor báo rõ trạng thái hookless.
- `ac-no-duplicate-skills` (pending): Khi cài nhiều nền tảng cùng lúc, mỗi tool chỉ thấy một bản mỗi skill harnix-* theo ma trận thư mục mà tool đó đọc; doctor cảnh báo khi có trùng.
- `ac-registry-only` (pending): Hai nền tảng được thêm chỉ bằng bản ghi registry và fixture; không thêm nhánh theo tên nền tảng ngoài registry.
- `ac-verified-facts` (pending): Đường dẫn, biến môi trường relocate root và schema hook của OpenCode/Cursor được xác minh bằng nguồn chính thức kèm ngày truy cập và ghi vào docs; điểm chưa xác minh được ghi rõ giới hạn.
- `ac-docs-sync` (pending): PRD, ranh giới Supported platforms trong AGENTS.md, README và docs global setup được cập nhật trong cùng task.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
