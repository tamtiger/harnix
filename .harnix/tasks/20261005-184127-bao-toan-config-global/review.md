# Bảo toàn cấu hình global của người dùng

- **ID:** 20261005-184127-bao-toan-config-global
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-05 18:41:25 +07:00
- **Updated:** 2026-10-05 20:43:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Setup/update/uninstall không được làm hỏng hay thay đổi nội dung không thuộc Harnix; exit code và smoke phủ đủ 6 platform (R-010, R-011, R-018 đến R-021, R-031, R-032).

## Non-goals

- Không thêm platform hay file global mới
- Không chạm home thật trong test

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Codex `config.toml`: phát hiện `hooks.UserPromptSubmit` đã được định nghĩa không phải dạng array-of-tables (kể cả dotted/inline) thì giữ nguyên, báo `drifted`/collision thay vì nối block; giữ kiểu xuống dòng của file gốc (CRLF).
- `ac-2` (met): Claude `settings.json`: vòng setup rồi uninstall trả lại file đúng từng byte ban đầu, giữ thứ tự key, số nguyên lớn (vd. 12345678901234567890) và indent; chỉ dạng chuẩn hóa dùng để tính hash.
- `ac-3` (met): Uninstall không để lại khung rỗng do Harnix tạo: mảng `hooks.UserPromptSubmit` rỗng, các object cha rỗng và file `settings.json` chỉ còn `{}` bị gỡ; các thư mục cha rỗng sau khi xóa file sở hữu (skills, steering, hooks, plugins) bị dọn đến nhưng không gồm root đã xác minh; thư mục hoặc file có nội dung của người dùng giữ nguyên; vòng setup rồi uninstall trên home rỗng không để lại gì.
- `ac-4` (met): `setup --codex` gỡ hook `hooks.json` legacy chưa sửa đã được thay thế, không để Codex chạy hook hai lần; có test dùng `setupPlatforms` với fixture legacy.
- `ac-5` (met): Exit code nhất quán: `setup --cursor|--opencode` (kể cả `--dry-run`) trả 0 khi cài sạch; `update --global` dùng cùng báo cáo readiness và trả khác 0 khi `drifted`; ma trận exit code theo platform có test.
- `ac-6` (met): OpenCode: xác minh bằng `harnix-research` (chỉ đọc) việc OpenCode có đọc `XDG_CONFIG_HOME` hay không và ghi kết luận thành decision; nếu có thì root theo `$XDG_CONFIG_HOME/opencode` với kiểm tra an toàn như `CODEX_HOME`, nếu không xác nhận được thì `doctor` chỉ cảnh báo khi biến được đặt; `facts.ts` và `docs/GLOBAL_SETUP_REFACTOR_PLAN.md` ghi đúng kết luận; có test cho cả hai nhánh biến được đặt và không đặt.
- `ac-7` (met): Script release dùng home giả đầy đủ: `createIsolatedUserEnvironment` ghi đè `CLAUDE_CONFIG_DIR` và gỡ các biến relocate khác; `smoke:tarball` và `scan:release` phủ cả `--opencode` và `--cursor`; `isTestProcess` chỉ còn một định nghĩa và không phụ thuộc `NODE_ENV` của người dùng.
- `ac-8` (met): Cổng chất lượng xanh: `pnpm run typecheck`, `pnpm run lint` và `pnpm run test` (có coverage, không hạ ngưỡng) đều exit 0 trên cây mã cuối cùng của task.

## Required checks

- `check-platform` (focused): Test platform và vòng đời global — pass (2026-10-05 20:40:22 +07:00)
- `check-release-scripts` (focused): Test an toàn home giả của script release — pass (2026-10-05 20:40:26 +07:00)
- `check-smoke` (focused): Smoke tarball với home giả (chạy pack:check trước) — pass (2026-10-05 20:41:23 +07:00)
- `check-typecheck` (full): pnpm run typecheck exit 0 — pass (2026-10-05 20:41:34 +07:00)
- `check-lint` (full): pnpm run lint (format:check + ESLint) exit 0 — pass (2026-10-05 20:41:52 +07:00)
- `check-suite` (full): pnpm run test (vitest + coverage) exit 0 — pass (2026-10-05 20:42:46 +07:00)

## Decisions

- **d-opencode-xdg-root** — Root OpenCode theo XDG_CONFIG_HOME/opencode khi biến là đường dẫn tuyệt đối, ngược lại giữ ~/.config/opencode; biến rỗng hoặc tương đối bị bỏ qua.
  - _Why:_ Tài liệu chính thức chỉ nêu ~/.config/opencode nhưng issue anomalyco/opencode 6669 ghi nhận OpenCode đọc XDG_CONFIG_HOME; ghi nhầm chỗ thì skill và khối AGENTS.md không được OpenCode thấy. Bằng chứng là quan sát của người dùng, chưa phải tài liệu chính thức.
- **d-exit-code-readiness** — setup và update --global thoát 1 chỉ khi readiness khác trạng thái khỏe của platform (installed, installed-pending-trust cho Codex, precedence-unknown cho Antigravity) hoặc có cảnh báo không phải setupNotice; cài sạch, dry-run và chạy lặp thoát 0.
  - _Why:_ Ghi chú thông tin cố định làm setup cursor và opencode luôn thoát 1, và update --global thoát 0 dù drifted; tài liệu §4.25 quy định thoát 0 cho success và dry-run sạch.
- **d-json-in-place-edit** — settings.json và các file JSON dùng chung được sửa theo offset trên văn bản (chèn, thay, xóa đúng một phần tử mảng), không parse rồi ghi lại cả file; uninstall gỡ luôn mảng và object cha rỗng rồi xóa file chỉ còn khung rỗng.
  - _Why:_ Ghi lại cả file làm đổi thứ tự key, indent và làm sai số nguyên lớn trong cấu hình của người dùng; sửa theo offset giữ nguyên từng byte ngoài vùng chỉnh.

## Residual risks

- **r-empty-container-pruned** (low) — Nếu người dùng đã có sẵn mảng hooks.UserPromptSubmit rỗng hoặc object hooks rỗng thì sau uninstall các khung rỗng đó cũng bị gỡ, vì không phân biệt được với khung Harnix tạo; ý nghĩa cấu hình không đổi.
- **r-toml-scan-conservative** (low) — Bộ quét TOML không phải parser đầy đủ; có thể báo xung đột hooks.UserPromptSubmit cho file hợp lệ, khi đó Harnix giữ nguyên file và báo drifted kèm cách xử lý thủ công.
- **r-opencode-xdg-undocumented** (medium) — Việc OpenCode đọc XDG_CONFIG_HOME dựa trên issue công khai anomalyco/opencode 6669, chưa có trong tài liệu chính thức; nếu upstream đổi hành vi thì root OpenCode lệch và doctor sẽ không thấy.
- **r-codex-exit-zero** (low) — Codex ở trạng thái chờ tin cậy hook (installed-pending-trust) nay thoát 0 thay vì 1; script nào dựa vào exit 1 để nhắc người dùng mở /hooks phải đọc stderr hoặc trường readiness.

## Evidence

- `check-platform` — pass (2026-10-05 20:40:22 +07:00): pnpm vitest run test/platform test/safety test/integration test/unit/core test/unit/commands test/unit/cli-helpers.test.ts test/unit/cli-project-commands.test.ts — exit 0
- `check-release-scripts` — pass (2026-10-05 20:40:26 +07:00): pnpm vitest run test/safety test/unit/utils/test-process.test.ts — exit 0
- `check-smoke` — pass (2026-10-05 20:41:23 +07:00): pnpm smoke:tarball — exit 0
- `check-typecheck` — pass (2026-10-05 20:41:34 +07:00): pnpm typecheck — exit 0
- `check-lint` — pass (2026-10-05 20:41:52 +07:00): pnpm lint — exit 0
- `check-suite` — pass (2026-10-05 20:42:46 +07:00): pnpm test — exit 0
