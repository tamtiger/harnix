# PRD — [13] Thêm OpenCode và Cursor qua platform registry

## Bối cảnh

Task `add-platform-registry` (#12, completed) đã biến nền tảng thành bản ghi dữ liệu trong `src/core/platform/registry.ts`: `PlatformRecord` (roots, skillDirectories, instructionFile, contextHook, contextOutput, targets với planKey, shadowingFiles, facts). CLI flag, resolve root, reconcile, doctor, update, uninstall đều lái theo registry. Task này chứng minh registry bằng cách thêm **đúng hai** nền tảng OpenCode và Cursor chỉ bằng bản ghi registry + facts + configurator plan + fixture, không thêm nhánh theo tên nền tảng ngoài registry.

## Facts đã xác minh (nguồn chính thức, truy cập 2026-10-01)

### OpenCode (opencode.ai/docs/rules, opencode.ai/docs/config)
- Instruction global: `~/.config/opencode/AGENTS.md`. Precedence: global AGENTS.md **thắng** fallback `~/.claude/CLAUDE.md`. Tạo `~/.config/opencode/AGENTS.md` khiến OpenCode ngừng dùng fallback prompt `~/.claude/CLAUDE.md`. Chấp nhận vì Harnix chỉ sở hữu **marker block** trong AGENTS.md (nội dung ngoài block giữ nguyên) và block đó chứa cùng nội dung rule; skills có disable var riêng (`OPENCODE_DISABLE_CLAUDE_CODE_SKILLS`) nên không ảnh hưởng.
- Skills native: `~/.config/opencode/skills/` (tên số nhiều, cùng danh sách plural `agents/ commands/ modes/ plugins/ skills/ tools/ themes/`).
- Không có env var relocate **root** `~/.config/opencode` (OPENCODE_CONFIG trỏ 1 file; OPENCODE_CONFIG_DIR thêm 1 thư mục custom chứ không đổi root; XDG_CONFIG_HOME là quy ước XDG, không wiring) → `envOverride: null`, ghi giới hạn trong docs.
- Không có shell hook user-global → **hookless** (`contextHook: null`, `contextOutput: "plain"`). Không cài plugin JS mặc định.

### Cursor (cursor.com/docs/hooks)
- Không có file instruction global (User Rules chỉ qua UI; project rules là `.cursor/rules/*.md`) → `instructionFile: null`. Chỉ dựa vào skill.
- User hooks: `~/.cursor/hooks.json`, schema `version: 1`. `sessionStart` có output `additional_context` (string) + `env` (object) nhưng **fire-and-forget**; hai báo cáo chính thức trên forum.cursor.com cho thấy `additional_context` **không** inject ổn định vào system context ban đầu → độ tin cậy inject **chưa xác minh**.
- Quyết định: Cursor **hookless mặc định** (`contextHook: null`, `contextOutput: "plain"`, dựa vào skill). Hook `sessionStart` chỉ là tăng cường tùy chọn, **chưa bật** vì injection chưa xác minh; doctor báo rõ trạng thái hookless. **Không** dùng `beforeSubmitPrompt` (chỉ chặn/validate, không inject).
- Skills: `~/.cursor/skills/`. Không có env relocate root `~/.cursor` được tài liệu.

## Acceptance criteria

### ac-opencode-setup
setup/update/doctor/uninstall `--global --opencode` chạy đúng qua fake home: marker block trong `~/.config/opencode/AGENTS.md`, giữ nội dung ngoài block; hành vi với dự phòng `~/.claude/CLAUDE.md` được chọn, test và ghi rõ.
- **Verifies:** `test/platform/opencode-global.test.ts` cài qua fake home, khẳng định skills dưới `.config/opencode/skills/harnix-*/SKILL.md`, marker block trong `.config/opencode/AGENTS.md` giữ nội dung ngoài block, update idempotent, uninstall gỡ block + skills; doctor liệt kê opencode.

### ac-cursor-setup
setup/update/doctor/uninstall `--global --cursor` chạy đúng qua fake home; skill được Cursor đọc thấy (`~/.cursor/skills/`); nền tảng hookless nên doctor báo rõ trạng thái hookless (không cài hook sessionStart vì schema injection chưa xác minh).
- **Verifies:** `test/platform/cursor-global.test.ts` cài qua fake home, khẳng định skills dưới `.cursor/skills/harnix-*/SKILL.md`, không ghi instruction file, không ghi hooks.json; update idempotent; uninstall gỡ skills; doctor liệt kê cursor hookless.

### ac-no-duplicate-skills
Khi cài nhiều nền tảng cùng lúc, mỗi tool chỉ thấy một bản mỗi skill `harnix-*` theo ma trận thư mục mà tool đó đọc; doctor cảnh báo khi có trùng unowned.
- **Verifies:** `test/platform/skill-dedup.test.ts` cài opencode+cursor+claude cùng lúc, khẳng định mỗi root chỉ có một `skills/harnix-<name>/SKILL.md` (sourceId prefix riêng từng nền tảng), và doctor đánh dấu `unownedSkillUnit` khi tồn tại unit skill không do Harnix sở hữu.

### ac-registry-only
Hai nền tảng được thêm chỉ bằng bản ghi registry + facts + configurator plan + fixture; không thêm nhánh `switch`/`if` theo tên nền tảng ngoài registry.
- **Verifies:** `test/unit/core/platform/registry.test.ts` xác nhận `PLATFORM_IDS` gồm 6 nền tảng theo thứ tự ổn định và `validatePlatformRecords` xanh; grep khẳng định không có nhánh literal `"opencode"`/`"cursor"` ngoài `registry.ts`/`facts.ts`/configurator/`setup.ts` plan map/`user-paths.ts` named-field.

### ac-verified-facts
Đường dẫn, biến môi trường relocate root và schema hook của OpenCode/Cursor được xác minh bằng nguồn chính thức kèm ngày truy cập và ghi vào `facts.ts` + docs; điểm chưa xác minh (OpenCode không có relocate env; Cursor sessionStart injection) được ghi rõ giới hạn.
- **Verifies:** `test/unit/core/platform/facts.test.ts` (iterate records, mọi record có ≥1 fact ISO date hợp lệ) + review `OPENCODE_FACTS`/`CURSOR_FACTS` ghi source + verifiedOn 2026-10-01 và giới hạn.

### ac-docs-sync
PRD, ranh giới "Supported platforms" trong AGENTS.md, README và docs global setup được cập nhật trong cùng task (thêm OpenCode + Cursor, ghi facts + giới hạn).
- **Verifies:** `test/unit/docs/supported-platforms.test.ts` khẳng định `docs/HARNIX_PRD.md`, `AGENTS.md`, `README.md`, `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` nhắc OpenCode và Cursor; đọc tay xác nhận giới hạn được ghi.

## Non-goals
- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test (chỉ fake home).
- Không bump version (2.0.0 chỉ bump ở release-v2).
- Không thêm tool nào khác ngoài OpenCode và Cursor.
- Không cài plugin JS/extension mặc định; không ghi User Rules Cursor bằng cơ chế không chính thức; không ghi file project-local; không đụng MCP/credentials/settings không thuộc Harnix; không bật hook Cursor sessionStart (injection chưa xác minh).
