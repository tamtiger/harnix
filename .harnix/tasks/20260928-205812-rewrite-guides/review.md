# [14] Viết lại guides theo dạng lệnh + ràng buộc, bổ sung spec/project-facts

- **ID:** 20260928-205812-rewrite-guides
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:12.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Goal

Viết lại common và các guide ngôn ngữ/công nghệ còn giữ theo format ngắn (≤ 600 tok): lệnh verify chuẩn, ràng buộc bắt lỗi thật, lỗi thường gặp; sửa nội dung lỗi thời (Next.js, Django, Go); gỡ guide không đem lại khác biệt. KHÔNG chuyển guide thành SKILL.md — guides là bản dịch đúng của ECC rules/ (docs/UPSTREAM_MAPPING.md §7). Bổ sung .harnix/spec/project-facts.md (derived, sinh lại khi init/update) chứa stack đã xác nhận và lệnh verify theo package từ add-verify-detection.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).

## Acceptance criteria

- `ac-format` (pending): Mọi guide ≤ 600 tok và có mục lệnh verify.
- `ac-stale` (pending): Các nội dung lỗi thời đã nêu (Next.js, Django, Go) được sửa.
- `ac-project-facts` (pending): .harnix/spec/project-facts.md được sinh tại init/update, chứa stack đã xác nhận và lệnh verify theo package; là derived, không phải user-owned.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
