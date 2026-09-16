# PRD - Review, refactor và bổ sung platform Claude

## Outcome

Harnix hỗ trợ Claude Code như một user-global platform integration ngang hàng Kiro/Antigravity/Codex, sau khi loại bỏ nợ kỹ thuật mà review đã chứng minh: trùng lặp giữa các configurator và deprecated surface không còn caller.

## In scope

- Mở rộng platform set sang `claude`: `PlatformId`, config validation, CLI flags, hidden context command, context-report.
- Configurator `claude` cài ba fragment user-global dưới `~/.claude`: 7 skill `skills/harnix-*/SKILL.md`, managed block trong `CLAUDE.md`, và một json-array-member hook `UserPromptSubmit` trong `settings.json`.
- Parity lifecycle đầy đủ: `setup`, `update --global`, `doctor --global [--fix]`, `uninstall --global --claude --yes`.
- Refactor: một nguồn canonical dùng chung cho skill plan và activation-guard rule của mọi platform; xoá deprecated surface không còn caller.
- Đồng bộ normative docs, AGENTS.md, AGENTS template, README, release scanner guard, CHANGELOG và patch version.

## Out of scope

- Không tách `src/commands/internal-workflow.ts`: review không tìm được defect nào chứng minh việc tách, nên đây là residual risk được ghi nhận thay vì refactor suy đoán.
- Không đổi dòng chỉ thị tiếng Việt trong AGENTS template: người dùng đã quyết định giữ nguyên.
- Không thêm skill thứ tám, public CLI mới, persisted schema mới, MCP, telemetry hoặc network service.
- Không chạm `~/.claude.json`, credentials, `mcpServers`, `projects/`, `history`, `todos/` hoặc bất kỳ setting nào ngoài fragment Harnix sở hữu.
- Không cài integration lên user profile thật; mọi test dùng injected disposable home.

## Nguồn xác thực Claude Code

Contract surface lấy từ tài liệu chính thức, truy cập 2026-09-16:

- `https://code.claude.com/docs/en/skills` — personal skills tại `~/.claude/skills/<name>/SKILL.md`.
- `https://code.claude.com/docs/en/memory` — user instructions tại `~/.claude/CLAUDE.md`; Claude Code đọc `CLAUDE.md`, không đọc `AGENTS.md`.
- `https://code.claude.com/docs/en/hooks` — `hooks.UserPromptSubmit` là mảng matcher-group `{ hooks: [{ type, command, timeout }] }`; UserPromptSubmit không hỗ trợ `matcher`; timeout mặc định 30s; stdout plain-text được nạp làm context.
- `https://code.claude.com/docs/en/settings` — user settings tại `~/.claude/settings.json`.

### AC `ac-claude-global-surface`

`harnix setup --claude [--dry-run]` ghi đúng và chỉ đúng ba fragment dưới root `~/.claude` đã canonicalize: 7 file skill byte-identical với canonical `workflowSkills`, một managed block có marker trong `CLAUDE.md`, và một hook member `harnix-context` tại con trỏ `/hooks/UserPromptSubmit` trong `settings.json`. Chạy lại là idempotent; nội dung không liên quan trong `CLAUDE.md` và `settings.json` được bảo toàn nguyên vẹn; dry-run không ghi gì.

### AC `ac-claude-lifecycle-parity`

`update --global --claude`, `doctor --global` (gồm `--fix`), `uninstall --global --claude --yes`, `harnix context --platform claude` và `harnix context-report --platform claude` hoạt động ngang parity với ba platform hiện hữu: manifest sidecar riêng, drift được phát hiện và báo cáo, fragment do người dùng sửa được giữ lại thay vì ghi đè, và hidden context vẫn là no-write/no-network no-op ngoài project đã init.

### AC `ac-configurator-dedupe`

Bốn configurator lấy skill plan và activation-guard rule từ một nguồn canonical dùng chung; không còn bản sao thủ công của `workflowSkills.map` hay khối guard. Output của Kiro, Antigravity và Codex không đổi một byte nào so với trước refactor.

### AC `ac-dead-surface-removal`

`VersionLookup`, `SetupPlatformsOptions.versionLookup` và `SetupPlatformsOptions.root` bị xoá khỏi `src/commands/setup.ts`; typecheck, lint, build và toàn bộ test vẫn xanh, chứng minh không còn caller.

### AC `ac-contract-docs-sync`

Platform set mở rộng được phản ánh nhất quán trong `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`, `AGENTS.md`, `README.md` và AGENTS template. `scripts/scan-release.mjs` chấp nhận `claude` là platform hợp lệ trong generated output nhưng vẫn chặn `gemini-cli`, `cursor` và `windsurf`.

### AC `ac-release-readiness`

Patch version, `CHANGELOG.md`, metadata version của 7 skill và self-host manifest được cập nhật đúng một lần trước `verifying` qua `pnpm version:sync`; exact acceptance sequence mục 11 pass với worktree không có whitespace error hay generated drift.
