# Ghi learning bằng flag và báo kết quả capture khi finish

- **ID:** 20260930-143441-learning-flags-and-finish-report
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-30 14:34:41 +07:00
- **Updated:** 2026-09-30 14:47:01 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Agent ghi decisions và residualRisks bằng lệnh dạng flag không cần JSON, và `--finish --brief` cho biết learning đã capture bao nhiêu note cùng lý do khi bằng 0.

## Non-goals

- Không suy ra learning tự động từ hội thoại
- Không đổi bộ lọc an toàn của learning
- Không capture lại cho task đã hoàn tất
- Không đổi output của --finish khi không có --brief

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-add-decision-risk` (met): `--add-decision <id> --text <t> --rationale <t>` và `--add-risk <id> --text <t> [--severity low|medium|high]` thêm một decisions/residualRisks item vào task v3 active ở mọi stage chưa terminal mà không cần `--reason`, không đổi checkpoint, giữ nguyên tiếng Việt; id trùng, text hoặc rationale rỗng và văn bản hỏng mã hóa bị từ chối.
- `ac-finish-learning-report` (met): `--finish --brief` trả thêm `learning: { notes, captured, hint? }` với `captured` là số observation đã ghi vào journal, `hint` nêu lý do khi bằng 0 (không có note, hoặc note bị lọc); `--finish` không `--brief` vẫn trả đúng TaskRecord như cũ.
- `ac-guidance-learning` (met): Cookbook, skill `harnix-finish-work` và `harnix-brainstorm` hướng dẫn ghi note bằng `--add-risk`/`--add-decision` (câu tự đứng được, tái dùng) và đọc `learning.captured` sau khi finish; test đối chiếu flag tài liệu với CLI vẫn pass.
- `ac-docs-schema-learning` (met): `workflow --schema`, PRD, WORKFLOW, IMPLEMENTATION_PLAN §4 và AGENTS.md mô tả hai transport mới và báo cáo capture; output các lệnh hiện có không đổi ngoài danh sách transport của `--schema`.

## Required checks

- `chk-learning-flags-focused` (focused): Test tập trung cho transport ghi note, báo cáo finish và hướng dẫn. — pass (2026-09-30 14:45:06 +07:00)
- `chk-full-suite` (full): Typecheck, lint và toàn bộ test kèm coverage floor. — pass (2026-09-30 14:46:25 +07:00)

## Decisions

- **d-review-data-no-replan** — Decisions và residualRisks là dữ liệu review nên transport ghi chúng không cần --reason hay replan.
  - _Why:_ Chúng nằm ngoài contract hash; buộc replan sẽ khiến agent lại quay về dựng JSON.
- **d-report-only-in-brief** — Báo cáo capture chỉ có trong --finish --brief.
  - _Why:_ Giữ nguyên output đầy đủ của --finish và snapshot hành vi; cookbook dùng --brief cho mọi lệnh ghi.
- **d-dogfood-notes** — Task này tự ghi risk bằng --add-risk trước --finish để kiểm chứng learning.captured khác 0.
  - _Why:_ Chứng minh đường ghi note không cần JSON hoạt động đầu-cuối

## Residual risks

- **r-stale-installs** (medium) — Agent Kiro, Antigravity, Claude và Codex chỉ có --add-decision, --add-risk và báo cáo learning sau khi chạy harnix update --global; trước đó learning tiếp tục rỗng.
- **r-filtered-notes** (low) — Learning chỉ ghi các note đã nằm trong task; note dài hơn 500 ký tự, giống lệnh, chứa credential hoặc chỉ thị bị lọc và chỉ được báo qua learning.hint khi finish.

## Evidence

- `chk-learning-flags-focused` — pass (2026-09-30 14:45:06 +07:00): pnpm vitest run test/unit/core/workflow test/integration/commands test/workflow — focused learning flags
- `chk-full-suite` — pass (2026-09-30 14:46:25 +07:00): pnpm typecheck && pnpm lint && pnpm test — suite đầy đủ kèm coverage
