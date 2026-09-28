# [16] Repo-map hướng test-impact

- **ID:** 20260928-205814-add-test-impact-map
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:14.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Goal

Đổi hướng repo-map: thêm cạnh code→test theo import và quy ước đặt tên; lệnh repo-map --tests <path>; skill implement/verify dùng nó để chạy test bị ảnh hưởng trước rồi mới chạy suite; bỏ ranker không dùng.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thay thế suite gate: test bị ảnh hưởng chỉ là bước nhanh, check mức project vẫn bắt buộc.

## Acceptance criteria

- `ac-tests-edge` (pending): repo-map --tests trả đúng test bị ảnh hưởng trên fixture TS, Python, Go.
- `ac-skill-use` (pending): Skill implement/verify hướng dẫn chạy test bị ảnh hưởng rồi suite package.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
