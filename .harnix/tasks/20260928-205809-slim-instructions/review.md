# [11] Tinh gọn lớp chỉ dẫn, gộp skill và sửa C4–C8

- **ID:** 20260928-205809-slim-instructions
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:09.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/7 acceptance criteria met

## Goal

Gộp 7 skill thành 5 (harnix-plan, harnix-implement, harnix-verify, harnix-review, harnix-debug) theo bảng trách nhiệm ở design.md §1; viết lại AGENTS.md root, .harnix/workflow.md, marker block các nền tảng theo bộ 8 rule trong design.md; guard một chỗ; chế độ không hook; test ngân sách token; sửa C4–C8; bảo đảm mọi status/checkpoint hợp lệ có đúng một skill chủ sở hữu.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).

## Acceptance criteria

- `ac-skills` (pending): Catalog có đúng 5 skill mới, mỗi skill ≤ 2K tok; tên cũ được alias hoặc migrate khi update --global.
- `ac-budget` (pending): Test đo: chỉ dẫn luôn nạp ≤ 1.5K tok, đường direct ≤ 4K, Full ≤ 15K.
- `ac-hookless` (pending): Skill hoạt động đúng khi không có hook bằng cách tự gọi preflight.
- `ac-coverage-matrix` (pending): Test liệt kê toàn bộ status/checkpoint hợp lệ (planning, replan, ready, in_progress/implementing, verifying/verifying, verifying/finishing, mọi blocked/*, cancelled, completed) và xác nhận mỗi trạng thái có đúng một skill chủ sở hữu.
- `ac-contradictions-c4-c8` (pending): C4–C8 trong research/inventory.md của task audit không còn trong chỉ dẫn mới.
- `ac-template-exemptions` (pending): src/templates/** được gỡ khỏi danh sách miễn trừ max-lines sau khi viết lại.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
