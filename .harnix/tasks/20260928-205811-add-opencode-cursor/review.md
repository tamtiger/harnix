# [13] Thêm OpenCode và Cursor qua platform registry

- **ID:** 20260928-205811-add-opencode-cursor
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:11 +07:00
- **Updated:** 2026-10-01 10:48:51 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Thêm đúng hai nền tảng OpenCode và Cursor chỉ bằng bản ghi registry + fixture (chứng minh registry). OpenCode: marker block trong ~/.config/opencode/AGENTS.md giữ nội dung ngoài block; xử lý rõ rủi ro tạo file làm OpenCode ngừng dùng dự phòng ~/.claude/CLAUDE.md; skill qua skill sink chung; không có hook shell nên chạy chế độ không hook, không cài plugin JS mặc định. Cursor: không có file instruction global (User Rules chỉ qua UI) nên dựa vào skill + chế độ không hook; hook sessionStart trong ~/.cursor/hooks.json chỉ là tăng cường tùy chọn, bật khi đã xác minh schema additional_context; không dùng beforeSubmitPrompt. Chống trùng skill vì cả hai tool đọc nhiều thư mục (~/.agents/skills, ~/.claude/skills, ~/.cursor/skills, ~/.codex/skills, ~/.config/opencode/skills). Flag --opencode, --cursor cho setup/update/uninstall/doctor --global. Xác minh lại mọi đường dẫn, biến môi trường relocate root và schema hook bằng tài liệu chính thức lúc làm task (design.md §10).

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thêm tool nào khác ngoài OpenCode và Cursor.
- Không cài plugin JS/extension mặc định, không ghi User Rules của Cursor bằng cơ chế không chính thức, không ghi file project-local, không đụng MCP/credentials/settings không thuộc Harnix.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-opencode-setup` (met): setup/update/doctor/uninstall --global --opencode chạy đúng qua fake home: marker block trong ~/.config/opencode/AGENTS.md, giữ nội dung ngoài block; hành vi với dự phòng ~/.claude/CLAUDE.md được chọn, test và ghi rõ.
- `ac-cursor-setup` (met): setup/update/doctor/uninstall --global --cursor chạy đúng qua fake home; skill được Cursor đọc thấy; hook sessionStart chỉ được cài khi schema đã xác minh, nếu không doctor báo rõ trạng thái hookless.
- `ac-no-duplicate-skills` (met): Khi cài nhiều nền tảng cùng lúc, mỗi tool chỉ thấy một bản mỗi skill harnix-* theo ma trận thư mục mà tool đó đọc; doctor cảnh báo khi có trùng.
- `ac-registry-only` (met): Hai nền tảng được thêm chỉ bằng bản ghi registry và fixture; không thêm nhánh theo tên nền tảng ngoài registry.
- `ac-verified-facts` (met): Đường dẫn, biến môi trường relocate root và schema hook của OpenCode/Cursor được xác minh bằng nguồn chính thức kèm ngày truy cập và ghi vào docs; điểm chưa xác minh được ghi rõ giới hạn.
- `ac-docs-sync` (met): PRD, ranh giới Supported platforms trong AGENTS.md, README và docs global setup được cập nhật trong cùng task.

## Required checks

- `check-suite` (full): Project suite gate: lint + typecheck + toan bo test pass (chan hoi quy) — pass (2026-10-01 10:45:10 +07:00)
- `check-registry` (focused): Registry + facts: 6 nen tang la du lieu, facts co nguon + verifiedOn — pass (2026-10-01 10:43:24 +07:00)
- `check-platform` (focused): Lifecycle OpenCode/Cursor qua fake home + dedup skill — pass (2026-10-01 10:43:42 +07:00)
- `check-docs` (focused): Docs sync: PRD/AGENTS/README/global-setup nhac OpenCode+Cursor — pass (2026-10-01 10:14:38 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **d-opencode-facts** — OpenCode (opencode.ai/docs/rules + /docs/config, truy cap 2026-10-01): instruction global = ~/.config/opencode/AGENTS.md; skills native doc = ~/.config/opencode/skills/ (ten plural); KHONG co env var relocate rieng cho root ~/.config/opencode (OPENCODE_CONFIG tro 1 file, OPENCODE_CONFIG_DIR them thu muc custom chu khong doi root; XDG_CONFIG_HOME la quy uoc XDG, khong wiring) nen envOverride=null va ghi gioi han; tao ~/.config/opencode/AGENTS.md khien OpenCode ngung dung fallback prompt ~/.claude/CLAUDE.md (precedence), chap nhan vi ta so huu marker block, skills co disable var rieng OPENCODE_DISABLE_CLAUDE_CODE_SKILLS; khong co shell hook -> hookless, contextOutput plain.
  - _Why:_ AC ac-verified-facts yeu cau xac minh duong dan/env/hook bang nguon chinh thuc kem ngay truy cap.
- **d-cursor-facts** — Cursor (cursor.com/docs/hooks, truy cap 2026-10-01): KHONG co file instruction global (User Rules chi qua UI, project rules la .cursor/rules/*.md) nen instructionFile=null; user hooks = ~/.cursor/hooks.json schema version=1 (so nguyen duong); sessionStart output additional_context (string) + env (object) nhung la fire-and-forget, agent loop khong doi/khong ep; co 2 bao cao chinh thuc tren forum.cursor.com rang additional_context KHONG duoc inject on dinh vao system context ban dau -> injection chua xac minh. Skills doc tai ~/.cursor/skills/. Khong co env relocate root ~/.cursor duoc tai lieu. Quyet dinh: Cursor hookless mac dinh (contextHook=null, contextOutput plain, dua vao skill); sessionStart chi la tang cuong tuy chon, chua bat vi injection chua xac minh; KHONG dung beforeSubmitPrompt (chi chan/validate, khong inject).
  - _Why:_ AC ac-cursor-setup + ac-verified-facts: chi cai hook khi schema xac minh; schema version=1 xac minh nhung do tin cay inject chua -> giu hookless.
- **d-preserve-unowned-root** — Nen tang single-root dung chung voi tool (OpenCode ~/.config/opencode, Cursor ~/.cursor) phai dat preserveUnownedRoot=false giong Kiro/Claude, KHONG phai true nhu Antigravity plugin dir. preserveUnownedRoot=true khien setup tu choi khi root da ton tai (user that thuong co san ~/.cursor), coi ca root la unowned. Khi false, trung skill duoc bat o muc tung unit qua markUnownedSkillUnitCollisions (reason 'A pre-existing Harnix-namespaced skill unit is not owned by Harnix.').
  - _Why:_ Test platform lo ra: readiness drifted + ca root bi preserve khi preserveUnownedRoot=true tren shared root.
- **d-records-extraction** — Khi them record vao PLATFORM_RECORDS lam registry.ts > 300 dong (max-lines), tach mang record ra src/core/platform/records.ts; registry.ts giu type + ham + re-export PLATFORM_RECORDS. records.ts import type PlatformRecord tu registry (type-only, khong cycle runtime). Them import truc tiep records.ts trong registry.test.ts de thoa test-structure 'tests every source module'.
  - _Why:_ Giai phap thay vi them vao danh sach mien tru max-lines (chi duoc thu nho); giu dung huong tang va 300-dong cap.

## Residual risks

- **r-cursor-sessionstart** (medium) — Cursor sessionStart hook (hooks.json v1) co output additional_context nhung fire-and-forget va injection vao system context ban dau chua tin cay (2 bao cao chinh thuc 2026). Khi bat hook Cursor sau nay phai xac minh lai injection truoc, dung giả định no hoat dong.

## Evidence

- pass (2026-10-01 09:33:15 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-10-01 09:39:11 +07:00): Task contract revised at persisted replan: Planning convergence: thay check-suite nhap bang cac check tap trung cho tung AC theo quyet dinh d-draft-checks truoc khi ready; obligations chua tung dat ready.
- skipped (2026-10-01 09:39:27 +07:00): Task contract revised at persisted replan: Planning convergence per d-draft-checks: check tap trung cho AC lifecycle + dedup truoc ready.
- skipped (2026-10-01 09:39:35 +07:00): Task contract revised at persisted replan: Planning convergence per d-draft-checks: check tap trung cho AC docs-sync truoc ready.
- skipped (2026-10-01 09:40:15 +07:00): Task contract revised at persisted replan: Planning convergence per d-draft-checks: check-suite tro thanh suite gate scope full phu source+test+docs.
- `check-registry` — pass (2026-10-01 10:43:24 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-platform` — pass (2026-10-01 10:43:42 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-docs` — pass (2026-10-01 10:14:38 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-01 10:45:10 +07:00): pwsh — exit 0
