# [12] Registry nền tảng khai báo cho 4 nền tảng hiện có (nền tảng cho OpenCode/Cursor)

- **ID:** 20260928-205810-add-platform-registry
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:10 +07:00
- **Updated:** 2026-10-01 09:04:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Thay nhánh platform rải rác (tên nền tảng xuất hiện trong ~15 file src) bằng registry khai báo cho đúng 4 nền tảng Kiro, Antigravity, Codex, Claude Code; skill sink chung có kiểm tra trùng; gộp hai hệ reconcile (managed-files.ts / global-managed-files.ts) và hai doctor (doctor.ts / global-doctor.ts); tách src/utils/global-managed-files.ts theo mối quan tâm (discovery, reconcile, manifest, rollback); cập nhật contract Claude Code đọc AGENTS.md native (v2.1.277+); xác minh các điểm research chưa chắc của nền tảng hiện có (tên event hook Antigravity) trước khi đóng băng contract; migrate bản cài cũ khi skill đổi tên. Registry phải đủ để task kế tiếp add-opencode-cursor thêm OpenCode và Cursor chỉ bằng bản ghi dữ liệu, kể cả các khác biệt: nền tảng không có file instruction global (Cursor), nền tảng không có hook shell (OpenCode), và nhiều thư mục skill mà một tool đọc cùng lúc.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thêm nền tảng mới trong task này; OpenCode và Cursor thuộc task add-opencode-cursor (quyết định người dùng 2026-09-28).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-registry` (met): Mọi nhánh theo nền tảng đi qua một registry; thêm một nền tảng về sau chỉ cần một bản ghi dữ liệu và fixture test (chứng minh bằng fixture giả, không phát hành nền tảng mới).
- `ac-reconcile` (met): Global integration đã cài được reconcile không mất nội dung người dùng, kể cả skill đổi tên (fake home).
- `ac-split-global-managed` (met): global-managed-files.ts được tách theo mối quan tâm; một hệ reconcile và một doctor dùng chung cho project/global; các file này được gỡ khỏi danh sách miễn trừ max-lines và miễn trừ layering; logic global integration chuyển khỏi src/utils và src/commands vào src/core.
- `ac-unverified-facts` (met): Tên event hook Antigravity và các điểm chưa xác minh khác của 4 nền tảng được xác minh bằng nguồn chính thức hoặc ghi rõ giới hạn trước khi đóng băng.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (full): Lint, typecheck và toàn bộ test pass — pass (2026-10-01 09:03:20 +07:00)
- `check-registry` (focused): Registry nền tảng: bản ghi dữ liệu và fixture giả chứng minh thêm nền tảng không cần nhánh mới — pass (2026-10-01 09:01:24 +07:00)
- `check-reconcile` (focused): Reconcile global không mất nội dung người dùng, kể cả skill đổi tên (fake home) — pass (2026-10-01 09:02:02 +07:00)
- `check-layering` (focused): Tách module, gỡ miễn trừ max-lines và layering, kiến trúc đúng tầng — pass (2026-10-01 09:02:42 +07:00)
- `check-facts` (focused): Mỗi bản ghi nền tảng có nguồn và ngày xác minh; hook event Antigravity nằm trong registry — pass (2026-10-01 09:01:26 +07:00)
- `check-docs` (focused): Docs, README và skill khớp contract đã đổi — pass (2026-10-01 09:01:35 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **d-registry-di** — Nền tảng là bản ghi dữ liệu trong registry; desired files và member matchers của configurator được inject qua GlobalPlanProvider; project và global dùng chung bảng quyết định ownership nhưng giữ hai adapter I/O.
  - _Why:_ Core không được import configurators/templates; output công khai bị đóng băng nên không gộp thành một engine duy nhất (D15).

## Residual risks

- **r-kiro-trigger** (low) — Tên trigger JSON UserPromptSubmit của Kiro không được trích nguyên văn trên trang công khai; contract giữ nguyên và ghi là giới hạn đã biết.
- **r-legacy-scope-enum** (low) — Enum scope legacy kiro|antigravity|codex của manifest project là dữ liệu lưu trữ đóng băng nên chưa nằm trong registry; thêm OpenCode/Cursor không ghi vào manifest project.
- **r-reconcile-obsolete-cycle** (low) — src/core/global/reconcile.ts và obsolete.ts import vòng nhau (reconcileJsonMember, preserve, pushUnique); hiện an toàn vì chỉ gọi lúc runtime, nên tách preserve/pushUnique ra module riêng khi có dịp.
- **r-doctor-rollback-scope** (low) — Partial-rollback finding của doctor giờ gán theo root đã đăng ký trong registry: codex gồm ~/.codex, antigravity thu hẹp vào hai thư mục plugin Harnix (trước là toàn bộ ~/.gemini); thay đổi có chủ đích, không đổi finding code.

## Evidence

- pass (2026-10-01 08:08:06 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-10-01 08:08:26 +07:00): Task contract revised at persisted replan: Migrated v2 draft; bổ sung check tập trung cho từng AC trước ready
- skipped (2026-10-01 08:08:33 +07:00): Task contract revised at persisted replan: Migrated v2 draft; bổ sung check tập trung cho từng AC trước ready
- skipped (2026-10-01 08:08:34 +07:00): Task contract revised at persisted replan: Migrated v2 draft; bổ sung check tập trung cho từng AC trước ready
- skipped (2026-10-01 08:08:34 +07:00): Task contract revised at persisted replan: Migrated v2 draft; bổ sung check tập trung cho từng AC trước ready
- skipped (2026-10-01 08:08:35 +07:00): Task contract revised at persisted replan: Migrated v2 draft; bổ sung check tập trung cho từng AC trước ready
- skipped (2026-10-01 08:08:35 +07:00): Task contract revised at persisted replan: Migrated v2 draft; bổ sung check tập trung cho từng AC trước ready
- `check-registry` — pass (2026-10-01 09:01:24 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-facts` — pass (2026-10-01 09:01:26 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-docs` — pass (2026-10-01 09:01:35 +07:00): pnpm — exit 0
- `check-reconcile` — pass (2026-10-01 09:02:02 +07:00): pnpm — exit 0
- `check-layering` — pass (2026-10-01 09:02:42 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-01 09:03:20 +07:00): pnpm — exit 0
